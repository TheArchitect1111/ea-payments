'use client';

import { useEffect } from 'react';

/** Register Simplifi capture service worker (scope: /simplifi/capture). */
export default function SimplifiCaptureSwRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw-simplifi-capture.js', { scope: '/simplifi/capture/' }).catch(() => {
      /* non-blocking — PWA still works without SW */
    });
  }, []);

  return null;
}
