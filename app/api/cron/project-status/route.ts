import { NextRequest } from 'next/server';
import { getAdminNotificationEmail } from '@/lib/integration-env';
import { sendEmail } from '@ea/portal-chassis/email';
import { projectStatusMarkdown, runEaProjectStatusChecks } from '@/lib/ea-project-status-monitor.mjs';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== 'production';
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const report = await runEaProjectStatusChecks();
  const markdown = projectStatusMarkdown(report);
  console.log(JSON.stringify({ event: 'ea.project-status.completed', ...report.totals, generatedAt: report.generatedAt }));

  let emailSent = false;
  if (process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM_EMAIL?.trim()) {
    const html = markdown
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('\n', '<br/>');
    try {
      await sendEmail({
        to: process.env.EA_STATUS_EMAIL?.trim() || getAdminNotificationEmail(),
        subject: `EA Project Status — ${report.totals.critical} critical, ${report.totals.attention} attention`,
        html: `<div style="font-family:Arial,sans-serif;line-height:1.5">${html}</div>`,
      });
      emailSent = true;
    } catch {
      emailSent = false;
    }
  }

  return Response.json({ ...report, emailSent });
}
