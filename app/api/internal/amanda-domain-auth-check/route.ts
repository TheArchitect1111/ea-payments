import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const token = process.env.VERCEL_OIDC_TOKEN;
  if (!token) {
    return NextResponse.json({ oidcPresent: false, oldProjectStatus: null, newProjectStatus: null });
  }

  const headers = { Authorization: `Bearer ${token}` };
  const teamId = 'team_s7mlAoJkDCQYaXiSC8nYDNIX';
  const oldProject = 'prj_x53IeeX3G9inkYUg87NJTHaXT9nw';
  const newProject = 'prj_u7zAr2vz8bLLC4s77xlU5FnB8VTM';

  const [oldResponse, newResponse] = await Promise.all([
    fetch(`https://api.vercel.com/v9/projects/${oldProject}?teamId=${teamId}`, { headers, cache: 'no-store' }),
    fetch(`https://api.vercel.com/v9/projects/${newProject}?teamId=${teamId}`, { headers, cache: 'no-store' }),
  ]);

  return NextResponse.json({
    oidcPresent: true,
    oldProjectStatus: oldResponse.status,
    newProjectStatus: newResponse.status,
  });
}
