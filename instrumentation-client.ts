import * as Sentry from '@sentry/nextjs';
import { getMonitoringOptions, monitoringConfigured } from '@/lib/monitoring';

try {
  if (monitoringConfigured()) {
    Sentry.init(getMonitoringOptions());
  }
} catch {
  // Monitoring must never break the browser shell.
}
