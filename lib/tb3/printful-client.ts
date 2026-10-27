import 'server-only';
import {PrintfulError,requestTb3Printful} from './printful-transport';
export {PrintfulError};
export const TB3_PRINTFUL_STORE_ID = 18945233;
export async function tb3Printful<T>(path:string,init:RequestInit={}):Promise<T>{
  return requestTb3Printful<T>(path,init,{
    apiKey:process.env.PRINTFUL_API_KEY,
    storeId:TB3_PRINTFUL_STORE_ID,
    fetcher:fetch,
  });
}
