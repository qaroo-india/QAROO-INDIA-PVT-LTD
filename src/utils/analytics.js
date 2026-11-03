// Lightweight analytics helper supporting Google Analytics (gtag/dataLayer)
// and Firebase Analytics.
import { logEvent } from 'firebase/analytics';
import { analyticsPromise } from '../config/firebase.js';

function win() {
  return typeof window !== 'undefined' ? window : null;
}

export function trackPageView(path) {
  const w = win();
  if (!w) return;
  try {
    if (typeof w.gtag === 'function') {
      w.gtag('event', 'page_view', { page_path: path, page_title: document.title });
    } else if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push({ event: 'page_view', page_path: path, page_title: document.title });
    }
  } catch {
    // ignore
  }

  analyticsPromise
    .then((analytics) => {
      if (analytics) {
        logEvent(analytics, 'page_view', {
          page_path: path,
          page_title: document.title,
        });
      }
    })
    .catch(() => {});
}

export function logAnalyticsEvent(eventName, params = {}) {
  const w = win();
  if (!w) return;
  try {
    if (typeof w.gtag === 'function') {
      w.gtag('event', eventName, params);
    } else if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push({ event: eventName, ...params });
    }
  } catch {
    // ignore
  }

  analyticsPromise
    .then((analytics) => {
      if (analytics) {
        logEvent(analytics, eventName, params);
      }
    })
    .catch(() => {});
}
