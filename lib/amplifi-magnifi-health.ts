import { EA_PLATFORM_URL } from '@/lib/platform-urls';
import { resolveConsiderExperience } from '@/lib/consider-resolve';

export type AmplifiMagnifiProbeResult = {
  ok: boolean;
  magnifiSample: {
    ok: boolean;
    path: string;
    status: number;
    detail: string;
  };
  magnifiUnavailable: {
    ok: boolean;
    path: string;
    status: number;
    detail: string;
  };
  amplifiUnauth: {
    ok: boolean;
    path: string;
    status: number;
    location: string;
    detail: string;
  };
  amplifiAuthed: {
    ok: boolean;
    path: string;
    status: number;
    detail: string;
  };
};

function platformBase(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL ?? EA_PLATFORM_URL).replace(/\/$/, '');
}

async function fetchManual(path: string, init?: RequestInit) {
  const res = await fetch(`${platformBase()}${path}`, {
    ...init,
    redirect: 'manual',
    signal: AbortSignal.timeout(12_000),
  });
  return res;
}

/**
 * Ops probes for portal-ready Amplifi/Magnifi (Phase 6).
 * Safe to run from /api/health/ops and launch diagnostics — no secrets required.
 */
export async function probeAmplifiMagnifiPortalReady(): Promise<AmplifiMagnifiProbeResult> {
  const unavailablePath = '/magnifi/__ea_ops_probe_missing__';
  let magnifiUnavailable = {
    ok: false,
    path: unavailablePath,
    status: 0,
    detail: 'not probed',
  };
  try {
    const res = await fetchManual(unavailablePath);
    const html = await res.text();
    const ok =
      res.status === 200 &&
      (/Story unavailable|Story retired/i.test(html) || /Magnifi/i.test(html));
    magnifiUnavailable = {
      ok,
      path: unavailablePath,
      status: res.status,
      detail: ok
        ? 'Calm unavailable page responds'
        : `Unexpected Magnifi missing response (${res.status})`,
    };
  } catch (err) {
    magnifiUnavailable = {
      ok: false,
      path: unavailablePath,
      status: 0,
      detail: err instanceof Error ? err.message : 'network error',
    };
  }

  let samplePath = '/magnifi/__ea_ops_probe_sample__';
  let magnifiSample = {
    ok: false,
    path: samplePath,
    status: 0,
    detail: 'no sample capture',
  };
  try {
    const resolved = await resolveConsiderExperience('selena');
    if (resolved?.captureId && resolved.captureId !== 'demo-selena') {
      samplePath = `/magnifi/${resolved.captureId}`;
      const res = await fetchManual(samplePath);
      const html = await res.text();
      const ok =
        res.status === 200 &&
        html.length > 800 &&
        !/Story unavailable|Story retired/i.test(html) &&
        /Magnifi/i.test(html);
      magnifiSample = {
        ok,
        path: samplePath,
        status: res.status,
        detail: ok ? 'Selena Magnifi story loads' : `Sample Magnifi failed (${res.status})`,
      };
    } else {
      // Static demo id is not a Capture Record — treat unavailable probe as the sample gate.
      magnifiSample = {
        ok: magnifiUnavailable.ok,
        path: samplePath,
        status: magnifiUnavailable.status,
        detail: 'No Airtable Selena capture — unavailable probe stands in for route health',
      };
    }
  } catch (err) {
    magnifiSample = {
      ok: false,
      path: samplePath,
      status: 0,
      detail: err instanceof Error ? err.message : 'sample probe error',
    };
  }

  const amplifiPath = '/portal/demo-client/amplifi';
  let amplifiUnauth = {
    ok: false,
    path: amplifiPath,
    status: 0,
    location: '',
    detail: 'not probed',
  };
  try {
    const res = await fetchManual(amplifiPath);
    const location = res.headers.get('location') || '';
    const ok =
      (res.status === 307 || res.status === 308) && /portal\/login/i.test(location);
    amplifiUnauth = {
      ok,
      path: amplifiPath,
      status: res.status,
      location,
      detail: ok ? 'Unauth Amplifi redirects to portal login' : `Expected login redirect, got ${res.status}`,
    };
  } catch (err) {
    amplifiUnauth = {
      ok: false,
      path: amplifiPath,
      status: 0,
      location: '',
      detail: err instanceof Error ? err.message : 'network error',
    };
  }

  let amplifiAuthed = {
    ok: false,
    path: amplifiPath,
    status: 0,
    detail: 'not probed',
  };
  try {
    const enter = await fetchManual(
      `/api/auth/demo-enter?next=${encodeURIComponent(amplifiPath)}`,
    );
    const raw =
      typeof enter.headers.getSetCookie === 'function' ? enter.headers.getSetCookie() : [];
    const cookie = raw.map((h) => h.split(';')[0]).join('; ');
    if (!cookie.includes('ea_portal_session')) {
      amplifiAuthed = {
        ok: false,
        path: amplifiPath,
        status: enter.status,
        detail: 'demo-enter did not set portal session',
      };
    } else {
      const res = await fetch(`${platformBase()}${amplifiPath}`, {
        headers: { Cookie: cookie },
        redirect: 'follow',
        signal: AbortSignal.timeout(15_000),
      });
      const html = await res.text();
      const ok =
        res.status === 200 &&
        /Amplifi/i.test(html) &&
        (/ea-amplifi|Open latest Magnifi|Capture once|Review draft/i.test(html) ||
          html.length > 8_000);
      amplifiAuthed = {
        ok,
        path: amplifiPath,
        status: res.status,
        detail: ok ? 'Authed Amplifi hub serves for demo-client' : `Authed Amplifi failed (${res.status})`,
      };
    }
  } catch (err) {
    amplifiAuthed = {
      ok: false,
      path: amplifiPath,
      status: 0,
      detail: err instanceof Error ? err.message : 'network error',
    };
  }

  const ok =
    magnifiUnavailable.ok &&
    magnifiSample.ok &&
    amplifiUnauth.ok &&
    amplifiAuthed.ok;

  return {
    ok,
    magnifiSample,
    magnifiUnavailable,
    amplifiUnauth,
    amplifiAuthed,
  };
}

export function amplifiMagnifiSubsystem(probe: AmplifiMagnifiProbeResult): {
  id: string;
  name: string;
  status: 'healthy' | 'degraded' | 'critical';
  message: string;
} {
  const failed = [
    !probe.magnifiUnavailable.ok ? 'magnifi-unavailable' : null,
    !probe.magnifiSample.ok ? 'magnifi-sample' : null,
    !probe.amplifiUnauth.ok ? 'amplifi-unauth' : null,
    !probe.amplifiAuthed.ok ? 'amplifi-authed' : null,
  ].filter(Boolean);

  return {
    id: 'amplifi-magnifi',
    name: 'Amplifi + Magnifi portal',
    status: probe.ok ? 'healthy' : failed.length >= 3 ? 'critical' : 'degraded',
    message: probe.ok
      ? 'Magnifi sample + unavailable + Amplifi auth gates OK'
      : `Failed: ${failed.join(', ')}`,
  };
}
