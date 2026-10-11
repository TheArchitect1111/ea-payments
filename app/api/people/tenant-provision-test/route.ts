import type { NextRequest } from 'next/server';
import { runProvisionTest, provisionTestGET } from '@/lib/bricks/provision-test';
export const dynamic = 'force-dynamic';
export const GET = provisionTestGET;
export async function POST(req: NextRequest) { return runProvisionTest(req, 'people'); }
