import type { NextRequest } from 'next/server';
import { authorize, db, scope, handled, json } from '@/lib/tb3/server';
export async function GET(req: NextRequest) {return handled(async()=>{await authorize(req);const tables=['tb3_activity_logs','tb3_impact_metrics','tb3_documents','tb3_tutor_contacts','tb3_academic_status','tb3_notifications'];const rows=await Promise.all(tables.map(table=>db(`${table}?${scope()}`)));return json({ok:true,logs:rows[0],impact:rows[1],documents:rows[2],contacts:rows[3],academic:rows[4],notifications:rows[5]});});}
