import { createHmac } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { guardPortalApi } from '@/lib/api/portal-route';
import { guardAdminApi } from '@/lib/api/admin-route';
import { findMembership } from '@/lib/memberships';
import { getOrganizationById } from '@/lib/organizations';
import { roleAtLeast, normalizeRole } from '@/lib/rbac';
import { TB3_ORGANIZATION_ID, TB3_PORTAL_SLUG, TB3_PREVIEW_WORKSPACE, hasTb3Identity } from './contracts';

export class Tb3Error extends Error { constructor(public status: number, message: string) { super(message); } }
export function workspace() {
  // No production writes until a separately approved production configuration.
  if (process.env.VERCEL_ENV === 'production') throw new Tb3Error(503, 'TB3 shared tracking is available in the approved preview only.');
  return TB3_PREVIEW_WORKSPACE;
}
export async function authorize(req: NextRequest, write = false) {
  const portal = await guardPortalApi(req, {slug: TB3_PORTAL_SLUG});
  if (portal.ok && hasTb3Identity(portal.session)) {
    const [member, org] = await Promise.all([findMembership(portal.session.email!, TB3_ORGANIZATION_ID), getOrganizationById(TB3_ORGANIZATION_ID)]);
    const minimum = write ? 'staff' : 'viewer';
    if (org?.status === 'Active' && org.portalSlug === TB3_PORTAL_SLUG && member?.status === 'active'
      && roleAtLeast(normalizeRole(member.role), minimum) && roleAtLeast(normalizeRole(portal.session.role), minimum)) {
      return {actor: portal.session.email!, workspace: workspace()};
    }
  }

  const admin = await guardAdminApi(req);
  if (admin.ok && roleAtLeast(normalizeRole(admin.user.role), 'admin')) {
    return {actor: admin.user.email, workspace: workspace()};
  }

  if (portal.ok) throw new Tb3Error(403, 'Active Tarris membership required.');
  if (admin.ok) throw new Tb3Error(403, 'EA admin access required.');
  throw new Tb3Error(portal.status === 401 && admin.status === 401 ? 401 : 403, 'Private TB3 HQ access required.');
}
export async function db<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  workspace();
  const url = (process.env.TB3_SUPABASE_URL?.trim() || process.env.PEOPLE_SUPABASE_URL?.trim() || 'https://dwygvwnjjaennksddniu.supabase.co').replace(/\/$/, '');
  const apiKey = process.env.PEOPLE_SUPABASE_API_KEY?.trim();
  const secret = process.env.PEOPLE_SUPABASE_JWT_SECRET?.trim();
  if (!url || !apiKey || !secret) throw new Tb3Error(503, 'Shared tracking connection is not configured. Please contact the team.');
  const now = Math.floor(Date.now()/1000);
  const encoded = (v: unknown) => Buffer.from(JSON.stringify(v)).toString('base64url');
  const unsigned = `${encoded({alg:'HS256',typ:'JWT'})}.${encoded({role:'people_app',iss:'supabase',iat:now-30,exp:now+300})}`;
  const token = `${unsigned}.${createHmac('sha256',secret).update(unsigned).digest('base64url')}`;
  const response = await fetch(`${url}/rest/v1/${path}`, {...init, cache:'no-store', headers:{...Object.fromEntries(new Headers(init.headers)),apikey:apiKey,Authorization:`Bearer ${token}`,'Content-Type':'application/json','Accept-Profile':'public','Content-Profile':'public',Prefer:'return=representation'}, signal:AbortSignal.timeout(15000)});
  if (!response.ok) throw new Tb3Error(response.status === 409 ? 409 : 503, response.status === 409 ? 'A linked event already exists or the record changed. Refresh and try again.' : 'Shared tracking is temporarily unavailable. Nothing was confirmed saved.');
  return await response.json() as T;
}
export const scope = () => `workspace_key=eq.${encodeURIComponent(workspace())}`;
export const scopedId = (id: string) => `${scope()}&id=eq.${encodeURIComponent(id)}`;
export function json(data: unknown, status = 200) { return NextResponse.json(data,{status,headers:{'Cache-Control':'private, no-store'}}); }
export async function handled(action: () => Promise<NextResponse | Response>) {
  try { return await action(); } catch (error) {
    if (error instanceof Tb3Error) return json({ok:false,error:error.message},error.status);
    if (error && typeof error === 'object' && 'issues' in error) return json({ok:false,error:'Check the required fields, dates and amounts.'},400);
    console.error('TB3 request failed', error instanceof Error ? error.name : 'Unknown');
    return json({ok:false,error:'Request could not be completed. Please try again.'},503);
  }
}
export function sameOrigin(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (origin && origin !== req.nextUrl.origin) throw new Tb3Error(403, 'Request origin denied.');
}
export async function body(req: NextRequest) {
  if (Number(req.headers.get('content-length')||0)>20000) throw new Tb3Error(413,'Request too large.');
  const text = await req.text();
  if (text.length>20000) throw new Tb3Error(413,'Request too large.');
  try { return JSON.parse(text); } catch { throw new Tb3Error(400,'Invalid request.'); }
}
