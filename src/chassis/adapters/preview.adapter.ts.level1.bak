import { sourceAdapter } from './sourceAdapter';
import { readFile } from 'node:fs/promises';
export const previewAdapter=sourceAdapter({id:'preview',files:[{path:'app/api/preview/verify-portal/route.ts',contains:'is_test: true'}],verify:async()=>{
 const src=await readFile('app/api/preview/verify-portal/route.ts','utf8');
 const guard=src.includes("process.env.VERCEL_ENV !== 'preview'")&&src.includes('status: 404');
 const synthetic=src.includes('synthetic: true')&&src.includes('is_test: true')&&src.includes('auth_granted: false');
 return {status:guard&&synthetic?200:503,evidence:`Preview source contract guard=${guard}, synthetic=${synthetic}; deployed response not verified`};
}});
