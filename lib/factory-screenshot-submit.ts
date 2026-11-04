import { z } from 'zod';
import { submitCapture, readCapture } from '@/lib/bricks/capture-family';
import { createPortalFormSubmission, listPortalFormSubmissions } from '@/lib/portal-forms/store';
import type { ScreenshotBuildResult, ScreenshotTenant } from './factory-screenshot-build';

export async function submitScreenshotForm(draft: ScreenshotBuildResult, tenant: ScreenshotTenant,
  raw: Record<string, string>, identity: { email: string }) {
  if (!draft.tenant || draft.tenant.organizationId !== tenant.organizationId || draft.tenant.portalSlug !== tenant.portalSlug)
    throw new Error('Screenshot form tenant mismatch');
  if (raw.revision !== draft.revision) throw new Error('Draft changed. Reload before submitting.');
  const page = draft.pages.find(p => p.id === raw.pageId);
  const component = page?.spec.components.find(c => c.id === raw.componentId && c.type === 'form');
  const kind = page?.forms[raw.componentId];
  if (!component || !kind) throw new Error('Confirmed form binding required');
  const requestId = z.string().regex(/^[a-zA-Z0-9-]{6,120}$/).parse(raw.requestId);
  const email = z.string().email().parse(raw.email).trim().toLowerCase();
  if (email !== identity.email.trim().toLowerCase()) throw new Error('Submission identity must match the signed-in portal member');
  const name = z.string().trim().min(1).max(200).parse(raw.name);
  const payload: Record<string, string> = {};
  for (const field of component.fields || []) {
    const value = (raw[field.name] || '').trim();
    if (value.length > 6000 || (field.required && !value)) throw new Error(`Invalid field: ${field.label}`);
    if (value && field.type === 'email') z.string().email().parse(value);
    if (value && field.type === 'number' && !Number.isFinite(Number(value))) throw new Error(`Invalid field: ${field.label}`);
    payload[field.name] = value;
  }
  const captureIdentity = `${draft.projectId}/${page!.id}/${component.id}/${requestId}`;
  const saved = await submitCapture(tenant, kind, { identity: captureIdentity, requestId, email, name, payload });
  const readBack = await readCapture(tenant, kind, captureIdentity);
  if (saved.id !== readBack.id || readBack.email !== email || JSON.stringify(readBack.payload) !== JSON.stringify(payload))
    throw new Error('Form persistence read-back failed');
  // Use the existing portal review ledger, with the same identity used by canonical capture.
  // Staff status transitions therefore reach the original capture rather than an unrelated duplicate.
  const ledgerKind = kind === 'applications' ? 'application' : 'intake';
  const ledgerPayload = { ...payload, canonicalCaptureId: readBack.id, factoryProjectId: draft.projectId };
  await createPortalFormSubmission({ portalSlug: tenant.portalSlug, kind: ledgerKind, name, email,
    payload: ledgerPayload, requireDurable: true, idempotencyId: captureIdentity });
  const rows = await listPortalFormSubmissions(tenant.portalSlug, { kind: ledgerKind, email });
  const actual = rows.find(row => row.id === captureIdentity);
  if (!actual || actual.portalSlug !== tenant.portalSlug || actual.email.trim().toLowerCase() !== email ||
    actual.name !== name || JSON.stringify(actual.payload) !== JSON.stringify(ledgerPayload))
    throw new Error('Portal submission ledger read-back failed');
  return { id: readBack.id, state: readBack.state, portalSubmissionId: actual.id,
    portalPath: `/portal/${tenant.portalSlug}/${kind === 'applications' ? 'applications' : 'intake'}` };
}
