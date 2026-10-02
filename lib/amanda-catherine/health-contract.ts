export function hasAmandaPremiumOwnerDashboard(html: string) {
  return ['Welcome, Amanda', 'Quick Actions', 'Business Overview'].every((marker) => html.includes(marker));
}

export function isAmandaCourseResourceResponse(status: number, location: string | null) {
  if (status === 200) return true;
  if (status !== 307 || !location) return false;
  try {
    const url = new URL(location);
    return url.protocol === 'https:' && url.hostname.endsWith('.blob.vercel-storage.com');
  } catch {
    return false;
  }
}
