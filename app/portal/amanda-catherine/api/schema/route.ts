import { GET as getSchema } from '@/app/api/amanda-catherine/schema/route';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  return getSchema();
}
