import { useEffect, useState } from 'react';

export default function NetworkStatus() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  if (online) return null;

  return (
    <div className="network-banner" role="alert">
      You're offline. Some content may be unavailable - check your connection and we'll catch you up when you're back online.
    </div>
  );
}