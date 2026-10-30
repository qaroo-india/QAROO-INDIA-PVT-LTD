import { useState } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'qaroo_consent_v1';

export function getConsent() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
  } catch {
    return null;
  }
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(() => !getConsent());

  const accept = (analytics) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ analytics, ts: Date.now() }));
    } catch {
      // private mode; just hide
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="consent-banner" role="region" aria-label="Cookie consent">
      <p>
        We use cookies to improve your browsing experience and, with your permission, to
        understand how the site is used. Read more in our{' '}
        <Link to="/privacy-policy" style={{ color: 'var(--eduact-base)', fontWeight: 600 }}>Privacy Policy</Link>.
      </p>
      <div className="consent-actions">
        <button type="button" className="state-btn" onClick={() => accept(true)}>Accept all</button>
        <button type="button" className="state-btn" style={{ background: 'var(--eduact-black)' }} onClick={() => accept(false)}>
          Essential only
        </button>
      </div>
    </div>
  );
}