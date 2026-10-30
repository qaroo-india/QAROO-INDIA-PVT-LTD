// Lightweight analytics helper. It activates automatically when a tag
// manager is present (Google Analytics gtag snippet or a dataLayer). Drop the
// GA snippet into index.html and page views / events start flowing. Without a
// snippet the calls are safe no-ops - analytics can never break the app.

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
}