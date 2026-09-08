export type AmplifiPerformanceInput = {
  impressions: number;
  reach?: number;
  engagements: number;
  clicks: number;
  conversions: number;
  spend?: number;
  revenue?: number;
  posts?: number;
};

export type AmplifiPerformanceInsight = {
  key: string;
  label: string;
  value: number;
  display: string;
  status: 'strong' | 'watch' | 'weak';
};

const safe = (value: unknown) => Math.max(0, Number(value) || 0);
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const money = (n: number) => `$${n.toFixed(2)}`;

export function analyzeAmplifiPerformance(raw: AmplifiPerformanceInput) {
  const impressions = safe(raw.impressions);
  const reach = safe(raw.reach);
  const engagements = safe(raw.engagements);
  const clicks = safe(raw.clicks);
  const conversions = safe(raw.conversions);
  const spend = safe(raw.spend);
  const revenue = safe(raw.revenue);
  const posts = Math.max(1, safe(raw.posts) || 1);
  const engagementRate = impressions ? engagements / impressions : 0;
  const ctr = impressions ? clicks / impressions : 0;
  const conversionRate = clicks ? conversions / clicks : 0;
  const cpa = spend && conversions ? spend / conversions : 0;
  const roas = spend ? revenue / spend : 0;
  const frequency = reach ? impressions / reach : 0;

  const insights: AmplifiPerformanceInsight[] = [
    { key: 'engagement', label: 'Engagement rate', value: engagementRate, display: pct(engagementRate), status: engagementRate >= .04 ? 'strong' : engagementRate >= .02 ? 'watch' : 'weak' },
    { key: 'ctr', label: 'Click-through rate', value: ctr, display: pct(ctr), status: ctr >= .02 ? 'strong' : ctr >= .01 ? 'watch' : 'weak' },
    { key: 'conversion', label: 'Click conversion', value: conversionRate, display: pct(conversionRate), status: conversionRate >= .08 ? 'strong' : conversionRate >= .03 ? 'watch' : 'weak' },
    ...(spend ? [{ key: 'cpa', label: 'Cost per conversion', value: cpa, display: conversions ? money(cpa) : 'No conversions', status: conversions ? 'watch' as const : 'weak' as const }] : []),
    ...(spend ? [{ key: 'roas', label: 'Return on ad spend', value: roas, display: `${roas.toFixed(2)}×`, status: roas >= 3 ? 'strong' as const : roas >= 1 ? 'watch' as const : 'weak' as const }] : []),
  ];

  const recommendations: string[] = [];
  if (engagementRate < .02) recommendations.push('Change the hook and first-frame creative before increasing distribution.');
  else if (ctr < .01) recommendations.push('The content is earning attention but not action. Strengthen the offer and CTA.');
  if (ctr >= .01 && conversionRate < .03) recommendations.push('Traffic is arriving but not converting. Audit the landing-page promise, proof and friction.');
  if (conversionRate >= .08) recommendations.push('Conversion quality is strong. Reuse the winning message in the next campaign and expand distribution carefully.');
  if (frequency > 4 && engagementRate < .02) recommendations.push('Audience frequency is high while response is soft. Rotate creative to reduce fatigue.');
  if (spend && roas < 1) recommendations.push('Paid return is below break-even on reported revenue. Hold budget growth until the offer or conversion path improves.');
  if (!recommendations.length) recommendations.push('Performance is balanced. Preserve the current message, test one variable at a time and use the next result as the control.');

  const score = Math.round(Math.min(100, (Math.min(engagementRate / .04, 1) * 30) + (Math.min(ctr / .02, 1) * 30) + (Math.min(conversionRate / .08, 1) * 30) + (spend ? Math.min(roas / 3, 1) * 10 : 10)));
  const diagnosis = score >= 80 ? 'Scale the winner' : score >= 55 ? 'Optimize before scaling' : 'Repair the campaign';

  return {
    score,
    diagnosis,
    insights,
    recommendations,
    totals: { impressions, reach, engagements, clicks, conversions, spend, revenue, posts, impressionsPerPost: Math.round(impressions / posts) },
    generatedAt: new Date().toISOString(),
    methodology: 'Directional thresholds for campaign diagnosis, not universal industry benchmarks.',
  };
}
