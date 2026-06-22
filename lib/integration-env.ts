/** Shared env resolution for Airtable, auth, and integration adapters. */

export function getAirtableApiKey(): string | undefined {
  return (process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT)?.trim() || undefined;
}

export function getAdminNotificationEmail(): string {
  return (
    process.env.ADMIN_NOTIFICATION_EMAIL?.trim() ||
    process.env.ADMIN_EMAIL?.trim() ||
    'freedom@efficiencyarchitects.online'
  );
}

export function isProductionDeploy(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
}

export function productionSecretIssues(): string[] {
  if (!isProductionDeploy()) return [];

  const issues: string[] = [];
  if (!process.env.SESSION_SECRET?.trim()) {
    issues.push('SESSION_SECRET');
  }
  if (!getAirtableApiKey()) {
    issues.push('AIRTABLE_API_KEY');
  }
  if (!process.env.RESEND_API_KEY?.trim()) {
    issues.push('RESEND_API_KEY');
  }
  if (!process.env.RESEND_FROM_EMAIL?.trim()) {
    issues.push('RESEND_FROM_EMAIL');
  }
  return issues;
}
