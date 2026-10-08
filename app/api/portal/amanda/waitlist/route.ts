import { POST as publicWaitlistPost } from '@/app/api/public/amanda/waitlist/route';
import type { NextRequest } from 'next/server';
// Canonical API alias for older Amanda portal forms. Validates the same strict course allowlist.
export async function POST(request: NextRequest) { return publicWaitlistPost(request); }
