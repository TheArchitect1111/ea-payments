/**
 * People persistence counters (blueprint §20.2).
 *
 * Process-local and non-authoritative: these feed ops dashboards/alerts, never
 * product decisions. Labels are redacted by construction — only enum-ish values
 * are accepted so no PII can reach a metric name (INV-25).
 */
export type PeopleMetricName =
  | 'people_airtable_request'
  | 'people_airtable_429'
  | 'people_airtable_5xx'
  | 'people_airtable_retry'
  | 'people_airtable_retry_exhausted'
  | 'people_fail_closed'
  | 'people_conflict'
  | 'people_duplicate_email_key'
  | 'people_merge_started'
  | 'people_merge_completed'
  | 'people_merge_failed'
  | 'people_merge_retryable'
  | 'people_import_row_failed'
  | 'people_import_failed_rate_limit'
  | 'people_reconcile_orphan'
  | 'people_illegal_flag_denied';

const counters = new Map<string, number>();

function metricKey(name: PeopleMetricName, label?: string): string {
  const safeLabel = (label || '').replace(/[^a-z0-9_.:-]/gi, '').slice(0, 48);
  return safeLabel ? `${name}{${safeLabel}}` : name;
}

export function incPeopleMetric(name: PeopleMetricName, label?: string, by = 1): void {
  const key = metricKey(name, label);
  counters.set(key, (counters.get(key) || 0) + by);
}

export function getPeopleMetric(name: PeopleMetricName, label?: string): number {
  return counters.get(metricKey(name, label)) || 0;
}

export function peopleMetricsSnapshot(): Record<string, number> {
  return Object.fromEntries([...counters.entries()]);
}

export function resetPeopleMetricsForTests(): void {
  counters.clear();
}
