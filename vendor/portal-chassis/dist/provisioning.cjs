'use strict';

// lib/airtable-client.ts
var BASE_URL = "https://api.airtable.com/v0";
function headers() {
  const pat = process.env.AIRTABLE_PAT;
  if (!pat) throw new Error("AIRTABLE_PAT is not set");
  return { Authorization: `Bearer ${pat}`, "Content-Type": "application/json" };
}
async function airtableGet(baseId, tableId, params) {
  const url = new URL(`${BASE_URL}/${baseId}/${tableId}`);
  if (params?.filterByFormula) url.searchParams.set("filterByFormula", params.filterByFormula);
  url.searchParams.set("maxRecords", String(params.maxRecords));
  params?.fields?.forEach((f) => url.searchParams.append("fields[]", f));
  params?.sort?.forEach((s, i) => {
    url.searchParams.set(`sort[${i}][field]`, s.field);
    url.searchParams.set(`sort[${i}][direction]`, s.direction);
  });
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) throw new Error(`airtableGet ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.records;
}
async function airtableCreate(baseId, tableId, fields) {
  const res = await fetch(`${BASE_URL}/${baseId}/${tableId}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ fields })
  });
  if (!res.ok) throw new Error(`airtableCreate ${res.status}: ${await res.text()}`);
  return res.json();
}

// lib/resend-client.ts
async function sendEmail(payload) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  const from = payload.from ?? process.env.RESEND_FROM_EMAIL;
  if (!from) throw new Error("RESEND_FROM_EMAIL is not set");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ ...payload, from })
  });
  if (!res.ok) throw new Error(`sendEmail ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return { id: data.id };
}

// lib/env.ts
function adminEmail(fallback = "") {
  return process.env.ADMIN_EMAIL?.trim() || fallback;
}

// lib/admin-notify.ts
async function notifyAdmin(input) {
  const to = input.to || adminEmail();
  if (!to) {
    console.error("notifyAdmin: no ADMIN_EMAIL or to address");
    return false;
  }
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#151515;max-width:620px;margin:0 auto;padding:24px">
      <h1 style="font-size:22px;margin:0 0 16px;color:#0C0C0A">${input.title}</h1>
      ${input.bodyHtml}
    </div>
  `;
  try {
    await sendEmail({
      to,
      subject: input.subject,
      html,
      from: input.from
    });
    return true;
  } catch (err) {
    console.error("notifyAdmin failed:", err);
    return false;
  }
}

// lib/make-client.ts
async function triggerMakeWebhook(webhookUrl, payload) {
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return { success: res.ok };
}

// lib/passwords.ts
var ITERATIONS = 1e5;
var KEY_BYTES = 32;
var SALT_BYTES = 16;
var encoder = new TextEncoder();
function toB64(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
async function derive(plain, salt, iterations) {
  const baseKey = await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(plain),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await globalThis.crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    baseKey,
    KEY_BYTES * 8
  );
  return new Uint8Array(bits);
}
async function hashPassword(plain) {
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(plain, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${toB64(salt)}$${toB64(hash)}`;
}
function generateTempPassword(length = 16) {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(length));
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

// lib/provisioning.ts
function slugify(input) {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
}
function mapField(tenant, logical) {
  return tenant.airtable.fieldMap?.[logical] ?? logical;
}
function resolveTable(tenant, table) {
  if (!table) {
    const first = Object.values(tenant.airtable.tables)[0];
    if (!first) throw new Error(`provisionPortalUser: tenant "${tenant.id}" has no airtable.tables`);
    return first;
  }
  return tenant.airtable.tables[table] ?? table;
}
function welcomeEmailHtml(args) {
  const creds = args.tempPassword ? `<p style="margin:0 0 8px"><strong>Email:</strong> ${args.email}</p>
       <p style="margin:0 0 16px"><strong>Temporary password:</strong>
         <code style="background:#f2f2f0;padding:2px 6px;border-radius:4px">${args.tempPassword}</code></p>
       <p style="margin:0 0 16px;color:#555">Please change this password after your first sign-in.</p>` : `<p style="margin:0 0 16px"><strong>Email:</strong> ${args.email}</p>`;
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#151515;max-width:560px;margin:0 auto;padding:24px">
      <h1 style="font-size:22px;margin:0 0 16px">Welcome to ${args.brandName}, ${args.name}</h1>
      <p style="margin:0 0 16px">Your portal account is ready. Sign in to get started.</p>
      ${creds}
      <p style="margin:0 0 24px">
        <a href="${args.loginUrl}"
           style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px">
          Open your portal
        </a>
      </p>
      <p style="margin:0;color:#777;font-size:13px">
        Need help? Contact <a href="mailto:${args.supportEmail}">${args.supportEmail}</a>.
      </p>
    </div>
  `;
}
async function provisionPortalUser(input) {
  const {
    tenant,
    email,
    name,
    role = "member",
    sendWelcomeEmail = true,
    notifyAdminOnCreate = true,
    failIfExists = true,
    loginPath = "/portal/login"
  } = input;
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    throw new Error("provisionPortalUser: a valid email is required");
  }
  if (!name.trim()) throw new Error("provisionPortalUser: name is required");
  const baseId = tenant.airtable.baseId;
  if (!baseId) throw new Error(`provisionPortalUser: tenant "${tenant.id}" has no airtable.baseId`);
  const tableId = resolveTable(tenant, input.table);
  const emailField = mapField(tenant, "Email");
  if (failIfExists) {
    const escaped = normalizedEmail.replace(/'/g, "\\'");
    const existing = await airtableGet(baseId, tableId, {
      filterByFormula: `LOWER({${emailField}}) = '${escaped}'`,
      maxRecords: 1
    });
    if (existing.length > 0) {
      throw new Error(`provisionPortalUser: a user with email ${normalizedEmail} already exists`);
    }
  }
  const slug = input.slug ? slugify(input.slug) : slugify(name) || slugify(normalizedEmail);
  const generated = !input.password;
  const password = input.password ?? generateTempPassword();
  const passwordHash = await hashPassword(password);
  const record = await airtableCreate(baseId, tableId, {
    [mapField(tenant, "Name")]: name.trim(),
    [emailField]: normalizedEmail,
    [mapField(tenant, "Role")]: role,
    [mapField(tenant, "Slug")]: slug,
    [mapField(tenant, "PasswordHash")]: passwordHash,
    [mapField(tenant, "Status")]: "active",
    [mapField(tenant, "CreatedAt")]: (/* @__PURE__ */ new Date()).toISOString(),
    ...input.fields
  });
  const canonical = tenant.urls.canonical.replace(/\/+$/, "");
  const loginUrl = `${canonical}${loginPath.startsWith("/") ? loginPath : `/${loginPath}`}`;
  let welcomeEmailSent = false;
  if (sendWelcomeEmail) {
    try {
      await sendEmail({
        to: normalizedEmail,
        from: tenant.brand.fromEmail,
        subject: `Welcome to ${tenant.brand.name}`,
        html: welcomeEmailHtml({
          brandName: tenant.brand.name,
          name: name.trim(),
          email: normalizedEmail,
          loginUrl,
          tempPassword: generated ? password : void 0,
          supportEmail: tenant.brand.supportEmail
        })
      });
      welcomeEmailSent = true;
    } catch (err) {
      console.error("provisionPortalUser: welcome email failed:", err);
    }
  }
  let adminNotified = false;
  if (notifyAdminOnCreate) {
    adminNotified = await notifyAdmin({
      subject: `[${tenant.brand.name}] New portal user: ${name}`,
      title: "Portal user provisioned",
      bodyHtml: `
        <p><strong>${name}</strong> (${normalizedEmail}) was provisioned as <strong>${role}</strong>.</p>
        <p>Record: ${record.id} \xB7 Slug: ${slug}</p>
      `,
      from: tenant.brand.fromEmail
    });
  }
  let webhookFired = false;
  if (input.welcomeWebhookEnvKey) {
    const url = process.env[input.welcomeWebhookEnvKey]?.trim();
    if (url) {
      const { success } = await triggerMakeWebhook(url, {
        event: "portal_user_provisioned",
        tenant: tenant.id,
        recordId: record.id,
        email: normalizedEmail,
        name: name.trim(),
        role,
        slug
      });
      webhookFired = success;
    }
  }
  return {
    recordId: record.id,
    email: normalizedEmail,
    name: name.trim(),
    role,
    slug,
    loginUrl,
    tempPassword: generated ? password : void 0,
    welcomeEmailSent,
    adminNotified,
    webhookFired
  };
}

exports.provisionPortalUser = provisionPortalUser;
//# sourceMappingURL=provisioning.cjs.map
//# sourceMappingURL=provisioning.cjs.map