/** Printful HTTP protocol adapter. Injectable transport lets us run a realistic,
 * no-charge provider-contract test against exact production request formatting. */
export class PrintfulError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name='PrintfulError';
  }
}
export async function requestTb3Printful<T>(
  path:string, init:RequestInit, opts:{
    apiKey:string|undefined; storeId:number; fetcher:typeof fetch;
  }):Promise<T> {
  if(!path.startsWith('/')||path.startsWith('//')||path.includes('://'))
    throw new PrintfulError(400,'Invalid Printful API path.');
  const key=opts.apiKey?.trim();
  if(!key)throw new PrintfulError(503,'Merchandise connection unavailable.');
  const headers=new Headers(init.headers);
  headers.set('Authorization','Bearer '+key);
  headers.set('X-PF-Store-Id',String(opts.storeId));
  headers.set('Content-Type','application/json');
  const response=await opts.fetcher('https://api.printful.com'+path,{
    ...init,headers,cache:'no-store',redirect:'error',
    signal:AbortSignal.timeout(30000),
  });
  const payload=await response.json().catch(()=>null) as {code?:number;result?:T}|null;
  if(!response.ok||!payload||payload.code!==200||
     !Object.prototype.hasOwnProperty.call(payload,'result'))
    throw new PrintfulError(response.status>=400?response.status:502,
      'Printful request failed. No successful change was confirmed.');
  return payload.result as T;
}
