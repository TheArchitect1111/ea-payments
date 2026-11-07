/** Keep request-origin validation independent of persistence and identity services. */
export function ayfWriteDenied(req: Request, slug: string) {
  return slug === 'are-you-fundable' && req.headers.get('origin') !== new URL(req.url).origin
    ? Response.json({ error: 'Same-origin request required' }, { status: 403 }) : null;
}
