import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { contactApi } from '../../api/contactApi.js';
import { applicationApi } from '../../api/applicationApi.js';
import { useAuth } from './AuthContext.jsx';

const NotificationContext = createContext(null);

const POLL_MS = 30000;
const NONE = { newMessages: 0, newApplications: 0, refresh: () => {} };

/**
 * Reads one count. Returns null when the number could not be established, so
 * the caller can keep the value it already had.
 *
 * A revoked permission really does mean nothing to show. Anything else -
 * offline, a restarting backend - must not clear a badge that was correct a
 * moment ago, or the admin sees "no new messages" when there are three.
 */
export async function countNew(call) {
  try {
    const res = await call();
    return res?.count || 0;
  } catch (err) {
    if (err?.status === 403 || err?.status === 401) return 0;
    return null;
  }
}

/** Applies a poll's results, holding the previous value where one is unknown. */
export function mergeCounts(prev, { messages, applications }) {
  return {
    newMessages: messages === null ? prev.newMessages : messages,
    newApplications: applications === null ? prev.newApplications : applications,
  };
}

/**
 * One poller for every admin notification badge.
 *
 * The sidebar, the topbar and the dashboard all show these counts. Each used
 * to poll for itself, which meant three requests per interval and three copies
 * of the number that could disagree. They share this one now.
 *
 * `refresh` is exposed so a page that changes a record's status can update the
 * badges at once, instead of leaving them wrong until the next interval.
 */
export function NotificationProvider({ children, pollMs = POLL_MS }) {
  const { hasPermission } = useAuth();
  const [counts, setCounts] = useState({ newMessages: 0, newApplications: 0 });

  const canMessages = hasPermission('contact.read');
  const canApplications = hasPermission('applications.read');

  const refresh = useCallback(async () => {
    if (!canMessages && !canApplications) {
      setCounts({ newMessages: 0, newApplications: 0 });
      return;
    }
    const [messages, applications] = await Promise.all([
      canMessages ? countNew(() => contactApi.list({ status: 'new' })) : 0,
      canApplications ? countNew(() => applicationApi.list({ status: 'new' })) : 0,
    ]);
    setCounts((prev) => mergeCounts(prev, { messages, applications }));
  }, [canMessages, canApplications]);

  useEffect(() => {
    let id = null;
    const start = () => { if (id === null) id = setInterval(refresh, pollMs); };
    const stop = () => { if (id !== null) { clearInterval(id); id = null; } };

    // No point polling a tab nobody is looking at; catch up when it returns.
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        stop();
      } else {
        refresh();
        start();
      }
    };

    refresh();
    if (document.visibilityState !== 'hidden') start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [refresh, pollMs]);

  const value = useMemo(() => ({ ...counts, refresh }), [counts, refresh]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

/**
 * Badge counts, plus `refresh`. Safe outside the provider - the login screens
 * render without it and simply have nothing to show.
 */
export function useNotifications() {
  return useContext(NotificationContext) || NONE;
}
