import catalog from '../../public/tb3/merch/manifest.json';

const columns = [
  'id', 'title', 'description', 'availability', 'condition', 'price',
  'link', 'image_link', 'brand', 'item_group_id', 'size',
];
function escapeCsv(value: string | number) {
  return '"' + String(value).replace(/"/g, '""') + '"';
}
/** Generate feed data. Availability must default to unavailable until verified. */
export type Tb3FeedStatus = { checkoutLive: boolean; verifiedAvailableVariantIds: ReadonlySet<number> };
export function buildTb3MetaFeed(status?: Tb3FeedStatus) {
  const rows = [columns.join(',')];
  for (const product of catalog) {
    for (const variant of product.variants) {
      rows.push([
        'tb3-' + variant.id,
        product.name + ' / ' + variant.size,
        'Official TB3 Tarris Bouie personal-brand merchandise. Not affiliated with University of Alabama.',
        (status?.checkoutLive && status.verifiedAvailableVariantIds.has(variant.id)) ? 'in stock' : 'out of stock', 'new', variant.price.toFixed(2) + ' USD',
        'https://tb3.online/tarris?utm_source=instagram&utm_medium=shop&utm_campaign=tb3_merch#merch-' + product.id,
        'https://tb3.online' + product.image,
        'TB3', product.id, variant.size,
      ].map(escapeCsv).join(','));
    }
  }
  return rows.join('\n') + '\n';
}
