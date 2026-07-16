import * as Sentry from '@sentry/nextjs';
import { getMonitoringOptions } from '@/lib/monitoring';

try {
  Sentry.init(getMonitoringOptions());
} catch {
  // Monitoring must never break the server.
}
