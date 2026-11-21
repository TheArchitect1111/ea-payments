import { sourceAdapter } from './sourceAdapter';
import type { BrickHealth } from '../BrickInterface';

export function createJaneAdapter(clientConfig: { janeUrl: string }) {
  return sourceAdapter({
    id: 'jane',
    files: [],
    verify: async (): Promise<BrickHealth> => {
      let url: URL;
      try { url = new URL(clientConfig.janeUrl); }
      catch { return { status: 503, evidence: 'Jane client URL is missing or invalid' }; }
      if (url.protocol !== 'https:' || !url.hostname.endsWith('.janeapp.com') || url.username || url.password) {
        return { status: 503, evidence: 'Jane client URL failed destination validation' };
      }
      return { status: 503, evidence: 'Jane destination validated; live integration not verified' };
    },
  });
}

export const janeAdapter = createJaneAdapter({ janeUrl: '' });

export default janeAdapter;
