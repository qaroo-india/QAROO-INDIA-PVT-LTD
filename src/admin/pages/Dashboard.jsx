import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import CountUp from '../../components/CountUp.jsx';
import { mouApi } from '../../api/mouApi.js';
import { csrApi } from '../../api/csrApi.js';
import { learningApi } from '../../api/learningApi.js';
import { businessSolutionApi } from '../../api/businessSolutionApi.js';
import { contactApi } from '../../api/contactApi.js';
import { applicationApi } from '../../api/applicationApi.js';
import { adminApi } from '../../api/adminApi.js';
import { useNotifications } from '../context/NotificationContext.jsx';
import { useToast } from '../../context/ToastContext';
import TrendChart from '../components/charts/TrendChart.jsx';
import DonutChart from '../components/charts/DonutChart.jsx';
import Sparkline from '../components/charts/Sparkline.jsx';
import { bucket, trend, recentAcross, relativeTime } from '../utils/activity.js';

const svgProps = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', viewBox: '0 0 24 24' };

const IconDoc = () => (
  <svg {...svgProps}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 13h6" /><path d="M9 17h6" /></svg>
);
const IconChat = () => (
  <svg {...svgProps}><path d="M21 12a8 8 0 0 1-8 8H6l-3 3V12a8 8 0 0 1 8-8h2a8 8 0 0 1 6 8z" /><path d="M8.5 9h7" /><path d="M8.5 12h7" /></svg>
);
const IconUsers = () => (
  <svg {...svgProps}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);
const IconHeart = () => (
  <svg {...svgProps}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
);
const IconCap = () => (
  <svg {...svgProps}><path d="M12 3 2 8l10 5 10-5-10-5z" /><path d="M4 10v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" /><path d="M22 8v5" /></svg>
);
const IconLayers = () => (
  <svg {...svgProps}><path d="M12 2 2 7l10 5 10-5-10-5z" /><path d="M2 12l10 5 10-5" /><path d="M2 17l10 5 10-5" /></svg>
);
const IconShield = () => (
  <svg {...svgProps}><path d="M12 3l7 3v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z" /><path d="M9.2 12l2 2 3.6-4" /></svg>
);
const IconPlus = () => (
  <svg {...svgProps}><path d="M12 5v14" /><path d="M5 12h14" /></svg>
);
const IconList = () => (
  <svg {...svgProps}><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /></svg>
);
const IconGlobe = () => (
  <svg {...svgProps}><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18z" /></svg>
);
const IconArrow = () => (
  <svg {...svgProps} width="13" height="13"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
);
const IconRefresh = () => (
  <svg {...svgProps}><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" /></svg>
);

// Chart colours are given as explicit hex rather than the tile's --tone, because
// a stroke has to stay legible on both the white card and the dark one. These
// are the tone hues pulled to a mid-tone that clears both backgrounds.
const CHART_COLOR = {
  mous: '#D4A017',
  messages: '#E05561',
  applications: '#8B5CF6',
  csr: '#16A97A',
  learning: '#1AA0BE',
  business: '#4F8CFF',
  admins: '#E08A0C',
};

const EMPTY = { mous: [], csr: [], learning: [], business: [], messages: [], applications: [] };

export default function Dashboard() {
  const { admin, hasPermission } = useAuth();
  const { newMessages, newApplications } = useNotifications();
  const toast = useToast();
  const navigate = useNavigate();
  const [onboardDismissed, setOnboardDismissed] = useState(() => {
    try { return localStorage.getItem('qaroo_onboarding_dismissed') === '1'; } catch { return false; }
  });
  const [stats, setStats] = useState({
    mous: 0,
    csr: 0,
    learning: 0,
    business: 0,
    messages: 0,
    applications: 0,
    admins: 0,
  });
  // The same responses the counts come from, kept so the charts need no extra
  // requests. Every model is saved with timestamps, so each row has createdAt.
  const [records, setRecords] = useState(EMPTY);
  const [statsError, setStatsError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState(Date.now());
  const [now, setNow] = useState(() => new Date());
  const [span, setSpan] = useState('day');
  const [hidden, setHidden] = useState(() => new Set());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const can = hasPermission;
  const isSuper = admin?.role === 'superadmin';

  const loadStats = useCallback(async ({ silent } = {}) => {
    if (!silent) setRefreshing(true);
    setStatsError(false);
    const next = { mous: 0, csr: 0, learning: 0, business: 0, messages: 0, applications: 0, admins: 0 };
    const rows = { ...EMPTY };
    let failed = false;
    try {
      const calls = [];
      if (can('mou.read')) calls.push(mouApi.list({}).then((r) => { next.mous = r.total ?? r.count ?? 0; rows.mous = r.data?.mous || []; }));
      if (can('csr.read')) calls.push(csrApi.list({}).then((r) => { next.csr = r.total ?? r.count ?? 0; rows.csr = r.data?.projects || []; }));
      if (can('learning.read')) calls.push(learningApi.list({}).then((r) => { next.learning = r.total ?? r.count ?? 0; rows.learning = r.data?.programs || []; }));
      if (can('business.read')) calls.push(businessSolutionApi.list({}).then((r) => { next.business = r.total ?? r.count ?? 0; rows.business = r.data?.solutions || []; }));
      if (can('contact.read')) calls.push(contactApi.list({}).then((r) => { next.messages = r.total ?? r.count ?? 0; rows.messages = r.data?.messages || []; }));
      if (can('applications.read')) calls.push(applicationApi.list({}).then((r) => { next.applications = r.total ?? r.count ?? 0; rows.applications = r.data?.applications || []; }));
      if (isSuper) calls.push(adminApi.list().then((r) => { next.admins = r.data?.admins?.length || 0; }).catch(() => { failed = true; }));
      await Promise.all(calls);
      setStats(next);
      setRecords(rows);
      setRefreshedAt(Date.now());
    } catch {
      failed = true;
    }
    setRefreshing(false);
    if (failed) {
      setStatsError(true);
      toast.error('Some dashboard stats could not be loaded. Click retry to try again.');
    }
  }, [can, isSuper, toast]);

  useEffect(() => { loadStats({ silent: true }); }, [loadStats]);

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateLabel = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeLabel = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const tiles = useMemo(() => [
    { key: 'mous', label: 'MOUs', to: '/admin/mous', count: stats.mous, icon: <IconDoc />, tone: 'tone-gold', show: can('mou.read') },
    { key: 'messages', label: 'Contact Messages', to: '/admin/messages', count: stats.messages, icon: <IconChat />, tone: 'tone-red', show: can('contact.read'), badge: newMessages },
    { key: 'applications', label: 'Job Applications', to: '/admin/applications', count: stats.applications, icon: <IconUsers />, tone: 'tone-violet', show: can('applications.read'), badge: newApplications },
    { key: 'csr', label: 'CSR Projects', to: '/admin/csr', count: stats.csr, icon: <IconHeart />, tone: 'tone-green', show: can('csr.read') },
    { key: 'learning', label: 'Learning Programs', to: '/admin/learning', count: stats.learning, icon: <IconCap />, tone: 'tone-cyan', show: can('learning.read') },
    { key: 'business', label: 'Business Solutions', to: '/admin/business-solutions', count: stats.business, icon: <IconLayers />, tone: 'tone-blue', show: can('business.read') },
    { key: 'admins', label: 'Admins', to: '/admin/admins', count: stats.admins, icon: <IconShield />, tone: 'tone-amber', show: isSuper },
  ].filter((t) => t.show), [stats, can, isSuper, newMessages, newApplications]);

  const total = tiles.reduce((sum, t) => sum + t.count, 0);
  const pctOf = (count) => (total ? Math.round((count / total) * 100) : 0);

  // ---- charts, all derived from the rows already in hand ----
  const periods = span === 'day' ? 30 : 12;

  const buckets = useMemo(() => {
    const out = {};
    for (const t of tiles) {
      out[t.key] = bucket(records[t.key] || [], { span, count: periods, now });
    }
    return out;
    // `now` ticks every second; only its day/month matters, so key off that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records, span, periods, tiles, now.toDateString()]);

  const labels = useMemo(() => {
    const first = tiles.find((t) => buckets[t.key]);
    return first ? buckets[first.key].map((b) => b.label) : [];
  }, [buckets, tiles]);

  const series = useMemo(() => tiles
    .filter((t) => !hidden.has(t.key))
    .map((t) => ({
      key: t.key,
      label: t.label,
      color: CHART_COLOR[t.key] || '#4F8CFF',
      values: (buckets[t.key] || []).map((b) => b.value),
    })), [tiles, buckets, hidden]);

  const addedThisPeriod = useMemo(
    () => tiles.reduce((sum, t) => {
      const b = buckets[t.key];
      return sum + (b && b.length ? b[b.length - 1].value : 0);
    }, 0),
    [tiles, buckets],
  );

  const recent = useMemo(() => recentAcross([
    { key: 'mous', label: 'MOU', tone: 'tone-gold', to: '/admin/mous', records: records.mous, title: (r) => r.heading || r.name, meta: (r) => r.tag },
    { key: 'messages', label: 'Message', tone: 'tone-red', to: '/admin/messages', records: records.messages, title: (r) => r.name, meta: (r) => r.subject || r.interest },
    { key: 'applications', label: 'Application', tone: 'tone-violet', to: '/admin/applications', records: records.applications, title: (r) => r.name, meta: (r) => r.jobTitle },
    { key: 'csr', label: 'CSR', tone: 'tone-green', to: '/admin/csr', records: records.csr, title: (r) => r.title, meta: (r) => r.partner || r.location },
    { key: 'learning', label: 'Program', tone: 'tone-cyan', to: '/admin/learning', records: records.learning, title: (r) => r.title, meta: (r) => r.category },
    { key: 'business', label: 'Solution', tone: 'tone-blue', to: '/admin/business-solutions', records: records.business, title: (r) => r.title || r.pageName, meta: () => '' },
  ].filter((g) => (g.records || []).length > 0), 7), [records]);

  const donut = useMemo(
    () => tiles.filter((t) => t.count > 0).map((t) => ({
      key: t.key, label: t.label, value: t.count, color: CHART_COLOR[t.key] || '#4F8CFF', to: t.to,
    })),
    [tiles],
  );

  const toggleSeries = (key) => setHidden((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    // Hiding every line leaves an empty chart; keep at least one on.
    if (next.size === tiles.length) return prev;
    return next;
  });

  const quick = [
    { show: can('mou.create'), to: '/admin/mous/create', label: '+ Add MOU', icon: <IconPlus /> },
    { show: can('mou.read'), to: '/admin/mous', label: 'Manage MOUs', icon: <IconList /> },
    { show: can('csr.read'), to: '/admin/csr', label: 'Manage CSR Projects', icon: <IconHeart /> },
    { show: can('learning.read'), to: '/admin/learning', label: 'Manage Learning Programs', icon: <IconCap /> },
    { show: can('business.read'), to: '/admin/business-solutions', label: 'Manage Business Solutions', icon: <IconLayers /> },
    { show: can('home.update'), to: '/admin/content', label: 'Manage Website Content', icon: <IconGlobe /> },
    { show: can('applications.read'), to: '/admin/applications', label: 'Job Applications', icon: <IconUsers />, badge: newApplications },
    { show: can('contact.read'), to: '/admin/messages', label: 'Contact Messages', icon: <IconChat />, badge: newMessages },
    { show: isSuper, to: '/admin/admins', label: 'Manage Admins', icon: <IconShield /> },
  ].filter((q) => q.show);

  return (
    <>
      <div className="dash-hero">
        <div>
          <div className="dash-hero__eyebrow">
            <span className="dash-live" aria-hidden="true" />
            Qaroo CMS &middot; Command Center
          </div>
          <h1>{greeting}, {admin?.name}</h1>
          <p className="dash-hero__sub">Live overview of the Qaroo India Private Limited CMS.</p>
          <div className="dash-hero__meta">
            <span className="dash-chip">{admin?.role === 'superadmin' ? 'Super Admin' : 'Admin'}</span>
            <span className="dash-clock">{dateLabel} &middot; {timeLabel}</span>
            <span className="dash-clock">Last sync {new Date(refreshedAt).toLocaleTimeString()}</span>
            <button
              type="button"
              className="dash-kbd-hint"
              onClick={() => window.dispatchEvent(new CustomEvent('qaroo:palette'))}
            >
              <kbd>ctrl</kbd><kbd>K</kbd> jump to anything
            </button>
          </div>
        </div>
        <div className="dash-hero__side">
          {can('contact.read') && (
            <Link to="/admin/messages" className="dash-hero__stat" style={{ '--tone': '#F4C430', '--tone-rgb': '244,196,48' }}>
              <span className="dash-dot" />
              <b>{newMessages}</b> unread messages
            </Link>
          )}
          {can('applications.read') && (
            <Link to="/admin/applications" className="dash-hero__stat" style={{ '--tone': '#8b5cf6', '--tone-rgb': '139,92,246' }}>
              <span className="dash-dot" />
              <b>{newApplications}</b> new applications
            </Link>
          )}
          <button type="button" className="dash-refresh" onClick={() => loadStats()} disabled={refreshing}>
            <span className={refreshing ? 'spin' : ''}><IconRefresh /></span> {refreshing ? 'Updating...' : 'Refresh'}
          </button>
        </div>
      </div>

      {statsError && (
        <div className="admin-alert error" style={{ marginBottom: '18px' }}>
          Could not load all dashboard stats.
          <button className="admin-btn" style={{ marginLeft: '10px' }} onClick={() => loadStats()}>Retry</button>
        </div>
      )}

      <div className="dash-stat-grid">
        {tiles.map((t, i) => {
          const b = buckets[t.key] || [];
          const tr = trend(b);
          return (
            <Link
              key={t.key}
              to={t.to}
              className={`dash-stat ${t.tone}`}
              style={{ animationDelay: `${i * 70}ms` }}
              title={`View ${t.label.toLowerCase()}`}
            >
              <div className="dash-stat__head">
                <span className="dash-ico">{t.icon}</span>
                {t.badge > 0 && <span className="dash-badge-pulse">{t.badge} new</span>}
              </div>
              <div className="dash-stat__num">
                <CountUp key={`${t.key}-${refreshedAt}`} to={t.count} duration={1.1} />
              </div>
              <div className="dash-stat__label">{t.label}</div>
              <div className="dash-stat__spark">
                <Sparkline values={b.map((x) => x.value)} color={CHART_COLOR[t.key] || '#4F8CFF'} />
                {tr && tr.pct !== null && tr.dir !== 'flat' && (
                  <span className={`dash-delta is-${tr.dir}`}>
                    {tr.dir === 'up' ? '▲' : '▼'} {Math.abs(tr.pct)}%
                  </span>
                )}
              </div>
              <div className="dash-stat__bar"><i style={{ width: `${pctOf(t.count)}%` }} /></div>
            </Link>
          );
        })}
      </div>

      <div className="dash-split">
        <div className="admin-card dash-panel ft-panel">
          <div className="dash-panel-head">
            <div>
              <h2>Activity</h2>
              <p className="hint">
                When records were actually created &mdash; {addedThisPeriod} added {span === 'day' ? 'today' : 'this month'}.
              </p>
            </div>
            <div className="ft-seg" role="group" aria-label="Chart period">
              <button type="button" className={span === 'day' ? 'is-on' : ''} onClick={() => setSpan('day')}>30 days</button>
              <button type="button" className={span === 'month' ? 'is-on' : ''} onClick={() => setSpan('month')}>12 months</button>
            </div>
          </div>

          <TrendChart
            series={series}
            labels={labels}
            emptyHint={`No records were created in the last ${span === 'day' ? '30 days' : '12 months'}.`}
          />

          <div className="ft-legend">
            {tiles.map((t) => (
              <button
                key={t.key}
                type="button"
                className={`ft-legend__item${hidden.has(t.key) ? ' is-off' : ''}`}
                onClick={() => toggleSeries(t.key)}
                aria-pressed={!hidden.has(t.key)}
              >
                <i style={{ background: CHART_COLOR[t.key] }} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="admin-card dash-panel ft-panel">
          <div className="dash-panel-head">
            <div>
              <h2>Content Mix</h2>
              <p className="hint">Share of each section across the CMS.</p>
            </div>
          </div>
          {donut.length > 0 ? (
            <DonutChart slices={donut} onPick={(s) => s.to && navigate(s.to)} />
          ) : (
            <p className="ft-empty">Nothing published yet.</p>
          )}
        </div>
      </div>

      {recent.length > 0 && (
        <div className="admin-card ft-panel" style={{ marginTop: '18px' }}>
          <div className="dash-panel-head">
            <div>
              <h2>Latest Activity</h2>
              <p className="hint">The newest records across every section.</p>
            </div>
          </div>
          <ul className="ft-feed">
            {recent.map((r) => (
              <li key={`${r.group}-${r.id}`} className={r.tone}>
                <Link to={r.to}>
                  <span className="ft-feed__pip" />
                  <span className="ft-feed__kind">{r.label}</span>
                  <span className="ft-feed__title">{r.title}</span>
                  {r.meta && <span className="ft-feed__meta">{r.meta}</span>}
                  <span className="ft-feed__when">{relativeTime(r.at, now.getTime())}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="admin-card ft-panel" style={{ marginTop: '18px' }}>
        <h2>Quick Actions</h2>
        <div className="dash-quick">
          {quick.map((q) => (
            <Link key={q.to} to={q.to} className="dash-quick__item">
              <span className="dash-quick__ico">{q.icon}</span>
              <span>{q.label}</span>
              {q.badge > 0 && <span className="dash-badge-pulse">{q.badge}</span>}
              <IconArrow />
            </Link>
          ))}
        </div>
      </div>

      {isSuper && !onboardDismissed && (stats.mous === 0 || stats.csr === 0 || stats.learning === 0) && (
        <div className="admin-card" style={{ marginTop: '18px' }}>
          <div className="admin-section-title">
            <span>Getting started</span>
            <button className="admin-icon-btn" onClick={() => { try { localStorage.setItem('qaroo_onboarding_dismissed', '1'); } catch { /* localStorage unavailable */ } setOnboardDismissed(true); }}>
              Dismiss
            </button>
          </div>
          <p className="hint" style={{ marginBottom: '12px' }}>A few quick wins to make the public site shine:</p>
          <ol style={{ margin: '0 0 0 20px', padding: 0, fontSize: '14.5px', lineHeight: 2 }}>
            {stats.learning === 0 && <li><Link to="/admin/learning/create">Add your first learning program (career tracks)</Link></li>}
            {stats.csr === 0 && <li><Link to="/admin/csr/create">Add your first CSR project</Link></li>}
            {stats.mous === 0 && <li><Link to="/admin/mous/create">Add your first MOU for the public directory</Link></li>}
            {stats.mous > 0 && <li><span style={{ color: '#2e7d32', fontWeight: 700 }}>✓</span> MOUs published</li>}
            {stats.csr > 0 && <li><span style={{ color: '#2e7d32', fontWeight: 700 }}>✓</span> CSR projects published</li>}
            {stats.learning > 0 && <li><span style={{ color: '#2e7d32', fontWeight: 700 }}>✓</span> Learning programs published</li>}
          </ol>
          <p className="hint" style={{ margin: '12px 0 0' }}>
            Tip: set <code>EMAIL_HOST</code>, <code>EMAIL_USER</code> and <code>EMAIL_PASS</code> in{' '}
            <code>backend/.env</code> so signup-verification and password-reset emails are actually delivered.
          </p>
        </div>
      )}
    </>
  );
}
