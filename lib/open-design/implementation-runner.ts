/**
 * Open Design → Cursor/GitHub/Vercel implementation handoff.
 * Creates a reviewable GitHub PR with the Cursor package; optionally fires a Vercel deploy hook.
 * Never auto-promotes to production — preview/hook only.
 */

import { buildCursorHandoffPackage, type CursorHandoffPackage } from './output-contract';
import type { CreativeExperienceBrief } from './types';
import { emitPulseEvent } from '@/lib/pulse-bus';
import { reportOpsError } from '@/lib/ops-error';

export type ImplementationHandoffResult = {
  ok: boolean;
  mode: 'github-pr' | 'package-only' | 'failed';
  handoff: CursorHandoffPackage;
  branch?: string;
  pullRequestUrl?: string;
  vercelHookFired?: boolean;
  error?: string;
};

function githubConfig() {
  const owner = process.env.OPEN_DESIGN_GITHUB_OWNER ?? process.env.GITHUB_OWNER ?? 'TheArchitect1111';
  const repo = process.env.OPEN_DESIGN_GITHUB_REPO ?? process.env.GITHUB_REPO ?? 'ea-payments';
  const baseBranch = process.env.OPEN_DESIGN_GITHUB_BASE ?? 'master';
  const token = process.env.GITHUB_TOKEN ?? process.env.OPEN_DESIGN_GITHUB_TOKEN;
  return { owner, repo, baseBranch, token };
}

function handoffMarkdown(handoff: CursorHandoffPackage): string {
  return [
    `# Open Design Handoff — ${handoff.organizationId}`,
    '',
    `Brief: \`${handoff.briefId}\``,
    `Generated: ${handoff.generatedAt}`,
    '',
    '## Story',
    '',
    handoff.storySentence,
    '',
    '## Creative DNA',
    '',
    handoff.creativeDnaSummary || '_Not set_',
    '',
    '## Design tokens',
    '',
    `- Source: \`${handoff.tokens.source}\``,
    `- Primary: ${handoff.tokens.primary}`,
    `- Secondary: ${handoff.tokens.secondary}`,
    handoff.tokens.accent ? `- Accent: ${handoff.tokens.accent}` : '',
    `- Display type: ${handoff.tokens.typography.display}`,
    `- Body type: ${handoff.tokens.typography.body}`,
    '',
    '## Deliverables',
    '',
    ...handoff.deliverables.flatMap((d) => [
      `### ${d.title} (\`${d.kind}\`)`,
      '',
      `Story beat: ${d.storyBeat}`,
      '',
      d.layoutNotes,
      '',
      d.tailwindNotes,
      '',
    ]),
    '## Standing rules',
    '',
    ...handoff.standingRules.map((r) => `- ${r}`),
    '',
    '## Implementation notes',
    '',
    '- Implement in Cursor using this package as the source of truth.',
    '- Map colors to `@/lib/design-system` — no ad-hoc brand hex.',
    '- Do not auto-merge; wait for executive / design review.',
    '',
  ]
    .filter(Boolean)
    .join('\n');
}

async function githubHeaders(token: string): Promise<Record<string, string>> {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function createGithubPullRequest(
  handoff: CursorHandoffPackage,
): Promise<{ branch: string; pullRequestUrl: string }> {
  const { owner, repo, baseBranch, token } = githubConfig();
  if (!token) {
    throw new Error('GITHUB_TOKEN (or OPEN_DESIGN_GITHUB_TOKEN) is required for GitHub handoff.');
  }

  const headers = await githubHeaders(token);
  const branch = `open-design/${handoff.briefId}`.replace(/[^a-zA-Z0-9/_-]/g, '-').slice(0, 100);

  const refRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`,
    { headers },
  );
  if (!refRes.ok) {
    throw new Error(`GitHub base ref failed (${refRes.status}): ${await refRes.text()}`);
  }
  const refJson = (await refRes.json()) as { object?: { sha?: string } };
  const baseSha = refJson.object?.sha;
  if (!baseSha) throw new Error('GitHub base SHA missing.');

  const createRef = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha }),
  });
  if (!createRef.ok && createRef.status !== 422) {
    throw new Error(`GitHub create branch failed (${createRef.status}): ${await createRef.text()}`);
  }

  const path = `docs/open-design-handoffs/${handoff.briefId}.md`;
  const content = Buffer.from(handoffMarkdown(handoff), 'utf8').toString('base64');
  const putFile = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: `Open Design handoff: ${handoff.organizationId} (${handoff.briefId})`,
      content,
      branch,
    }),
  });
  if (!putFile.ok) {
    throw new Error(`GitHub write handoff failed (${putFile.status}): ${await putFile.text()}`);
  }

  const jsonPath = `docs/open-design-handoffs/${handoff.briefId}.json`;
  const jsonContent = Buffer.from(JSON.stringify(handoff, null, 2), 'utf8').toString('base64');
  const putJson = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${jsonPath}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: `Open Design handoff JSON: ${handoff.briefId}`,
      content: jsonContent,
      branch,
    }),
  });
  if (!putJson.ok) {
    throw new Error(`GitHub write JSON failed (${putJson.status}): ${await putJson.text()}`);
  }

  const prRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: `Open Design handoff: ${handoff.organizationId}`,
      head: branch,
      base: baseBranch,
      body: [
        '## Summary',
        `- Cursor-ready Open Design handoff for \`${handoff.organizationId}\``,
        `- Story: ${handoff.storySentence}`,
        '',
        '## Next',
        '- Implement in Cursor from the handoff markdown/JSON',
        '- Review preview before production promote',
        '',
        'Do not auto-merge.',
      ].join('\n'),
    }),
  });
  if (!prRes.ok) {
    throw new Error(`GitHub create PR failed (${prRes.status}): ${await prRes.text()}`);
  }
  const prJson = (await prRes.json()) as { html_url?: string };
  if (!prJson.html_url) throw new Error('GitHub PR URL missing.');

  return { branch, pullRequestUrl: prJson.html_url };
}

async function fireVercelDeployHook(): Promise<boolean> {
  const url = process.env.OPEN_DESIGN_VERCEL_DEPLOY_HOOK_URL?.trim();
  if (!url) return false;
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) {
    throw new Error(`Vercel deploy hook failed (${res.status})`);
  }
  return true;
}

export function openDesignGithubConfigured(): boolean {
  return Boolean(githubConfig().token?.trim());
}

export function openDesignVercelHookConfigured(): boolean {
  return Boolean(process.env.OPEN_DESIGN_VERCEL_DEPLOY_HOOK_URL?.trim());
}

/** Run implementation handoff — GitHub PR when token set; otherwise package-only. */
export async function runOpenDesignImplementationHandoff(
  brief: CreativeExperienceBrief,
  options?: { tenantId?: string; fireVercelHook?: boolean },
): Promise<ImplementationHandoffResult> {
  const handoff = buildCursorHandoffPackage(brief);

  if (brief.blockers.length > 0 || !brief.profile.story.sentence.trim()) {
    return {
      ok: false,
      mode: 'failed',
      handoff,
      error: brief.blockers[0] ?? 'Story gate blocked — cannot hand off.',
    };
  }

  try {
    if (openDesignGithubConfigured()) {
      const { branch, pullRequestUrl } = await createGithubPullRequest(handoff);
      let vercelHookFired = false;
      if (options?.fireVercelHook !== false) {
        try {
          vercelHookFired = await fireVercelDeployHook();
        } catch (err) {
          await reportOpsError(err, {
            scope: 'open-design.vercel-hook',
            tags: { briefId: brief.id },
          });
        }
      }

      await emitPulseEvent({
        product: 'ea-platform',
        type: 'open.design.handoff.cursor',
        title: `Open Design handoff PR — ${brief.profile.organizationName}`,
        detail: pullRequestUrl,
        priority: 'high',
        href: pullRequestUrl,
        tenantId: options?.tenantId ?? brief.organizationId,
        objectId: brief.id,
        metadata: {
          branch,
          vercelHookFired,
          mode: 'github-pr',
        },
      });

      if (vercelHookFired) {
        await emitPulseEvent({
          product: 'ea-platform',
          type: 'open.design.deploy.preview',
          title: `Open Design preview deploy triggered — ${brief.profile.organizationName}`,
          detail: 'Vercel deploy hook fired for preview.',
          priority: 'medium',
          href: '/admin/creative-studio',
          tenantId: options?.tenantId ?? brief.organizationId,
          objectId: brief.id,
        });
      }

      return { ok: true, mode: 'github-pr', handoff, branch, pullRequestUrl, vercelHookFired };
    }

    await emitPulseEvent({
      product: 'ea-platform',
      type: 'open.design.handoff.cursor',
      title: `Open Design package ready — ${brief.profile.organizationName}`,
      detail: 'GitHub token not configured — package available for manual Cursor handoff.',
      priority: 'medium',
      href: '/admin/creative-studio',
      tenantId: options?.tenantId ?? brief.organizationId,
      objectId: brief.id,
      metadata: { mode: 'package-only' },
    });

    return { ok: true, mode: 'package-only', handoff };
  } catch (err) {
    await reportOpsError(err, {
      scope: 'open-design.implementation-handoff',
      tags: { briefId: brief.id, organizationId: brief.organizationId },
    });
    return {
      ok: false,
      mode: 'failed',
      handoff,
      error: err instanceof Error ? err.message : 'Implementation handoff failed.',
    };
  }
}
