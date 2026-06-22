import { after } from 'next/server';
import {
  processCaptureAsset,
  type AnalyzeOptions,
  type CaptureInput,
} from './capture-pipeline';
import { sendCaptureReadyEmail } from './email';

export interface ScheduleCaptureJobOptions extends AnalyzeOptions {
  notifyEmail?: string;
}

export function scheduleCaptureJob(
  recordId: string,
  input: CaptureInput,
  source: string,
  options: ScheduleCaptureJobOptions = {},
) {
  after(async () => {
    try {
      const result = await processCaptureAsset(recordId, input, source, options);
      if (!result.ok || !result.record || !options.notifyEmail) return;

      const base =
        options.baseUrl ??
        process.env.NEXT_PUBLIC_BASE_URL ??
        'https://ea-payments.vercel.app';

      await sendCaptureReadyEmail({
        email: options.notifyEmail,
        title: result.record.title,
        magnifiUrl: `${base}/magnifi/${result.record.id}`,
        considerUrl: result.opportunity?.shareUrl ?? result.record.shareUrl,
        guidanceUrl: `${base}/simplifi/guidance/${result.record.id}`,
      });
    } catch (err) {
      console.error('Background capture job failed:', err);
    }
  });
}
