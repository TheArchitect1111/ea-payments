import { sourceAdapter } from './sourceAdapter';
import type { BrickHealth } from '../BrickInterface';

/** URL is client-owned. Network failures are not treated as live integration success. */
export function createJaneAdapter(clientConfig: { janeUrl: string }) {
  return sourceAdapter({
    id: 'jane',
    files: [],
    verify: async (): Promise<BrickHealth> => {
      let url: URL;
      try { url = new URL(clientConfig.janeUrl); }
      catch { return { status: 503, evidence: 'Jane client URL is missing or invalid' }; }
      if (url.protocol !== 'https:' || !url.hostname.endsWith('.janeapp.com') ||
          url.hostname === '.janeapp.com' || url.username || url.password) {
        return { status: 503, evidence: 'Jane client URL failed destination validation' };
      }
      try {
        const response = await fetch(url.toString(), {
          method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(12000),
        });
        const final = new URL(response.url);
        const destinationValid = final.protocol === 'https:' && final.hostname.endsWith('.janeapp.com');
        const ok = response.status >= 200 && response.status < 400 && destinationValid;
        return {
          status: ok ? 200 : 503,
          evidence: 'Jane LIVE HTTP ' + response.status + ' ' + url.toString() +
            '; finalHost=' + final.hostname + '; approvedDestination=' + destinationValid,
        };
      } catch (error) {
        return { status: 503, evidence: 'Jane HTTP connection attempt logged ' +
          url.toString() + '; CONTRACT ONLY, not live: ' + String(error) };
      }
    },
  });
}
/** Compatibility export fails closed until a client configuration is injected. */
export const janeAdapter = createJaneAdapter({ janeUrl: '' });
