// Lightweight crash reporting. In production builds, uncaught errors are
// posted to the backend client-errors endpoint (stored for the admin).
// To switch to Sentry/Bugsnag later, forward `error` inside reportError instead.

import { API_BASE } from '../api/api.js';

const ENDPOINT = `${API_BASE}/client-errors`;

export function reportError(error, extra = {}) {
  try {
    const message = error instanceof Error ? error.message : String(error || 'Unknown error');
    const stack = error instanceof Error && error.stack ? error.stack : '';
    // Only log to the console in development (or when DEBUG_CRASH_LOGS is set),
    // so production browser consoles are not spammed with expected noise browser-side.
    if (!import.meta.env.PROD || import.meta.env.VITE_DEBUG_CRASH_LOGS === '1') {
      console.error('[crash-report]', message, extra, stack);
    }

    if (import.meta.env.PROD && typeof window !== 'undefined') {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'omit',
        body: JSON.stringify({
          message,
          stack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          extra,
          ts: new Date().toISOString(),
        }),
      }).catch(() => {});
    }
  } catch {
    // never let reporting break the app
  }
}

export function installGlobalHandlers() {
  if (typeof window === 'undefined') return;
  window.addEventListener('error', (event) => {
    reportError(event.error || event.message);
  });
  window.addEventListener('unhandledrejection', (event) => {
    reportError(event.reason || new Error('Unhandled promise rejection'));
  });
}