/** Browser/server CTA identity. Labels may change without breaking validation. */
export type AmandaClickScope = 'homepage' | 'classes' | 'portal' | 'pathway';
export function amandaCtaKey(label: string): string {
  return label.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100).replace(/-$/g, '') || 'open';
}
export function amandaClickScope(path: string): AmandaClickScope {
  if (path === '/' || path === '/amanda-catherine' || path === '/amanda') return 'homepage';
  if (path.endsWith('/classes')) return 'classes';
  if (/^\/amanda\/(restore|learn|create)/.test(path)) return 'pathway';
  return 'portal';
}
export function isAmandaSource(path: string): boolean {
  return path === '/' || /^\/(?:amanda(?:-catherine)?|courses)(?:\/|$)/.test(path)
    || /^\/portal\/amanda-catherine(?:\/|$)/.test(path);
}
export function isAmandaDestination(value: string): boolean {
  try {const url = new URL(value, 'https://amandacatherine.ca');
    return ['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol) && value.length <= 2000;
  } catch { return false; }
}
export type AmandaClick = {event_id: string; visitor_id: string; cta_key: string; cta_name: string;
  page: string; destination: string; timestamp: string; course_key?: string;};
export function trackAmandaClick(click: AmandaClick): void {
  const body = JSON.stringify({...click,event:'cta_click',portal_slug:'amanda-catherine'});
  const endpoint='/api/amanda-catherine/track';
  try {if(navigator.sendBeacon(endpoint,new Blob([body],{type:'application/json'})))return;}catch{}
  void fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true}).catch(()=>{});
}
