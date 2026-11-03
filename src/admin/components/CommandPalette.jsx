import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useAdminTheme } from '../context/AdminThemeContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';

/**
 * Ctrl/Cmd+K jump bar.
 *
 * Every entry is permission-checked the same way the sidebar is, so the palette
 * can never offer a route the signed-in admin would only be bounced out of.
 */

const ACTIONS = [
  { id: 'dash', label: 'Dashboard', hint: 'Overview and live stats', to: '/admin/dashboard', perm: 'dashboard.view', group: 'Go to' },
  { id: 'mous', label: 'MOU Directory', hint: 'Browse signed MOUs', to: '/admin/mous', perm: 'mou.read', group: 'Go to' },
  { id: 'csr', label: 'CSR Projects', hint: 'Community work', to: '/admin/csr', perm: 'csr.read', group: 'Go to' },
  { id: 'learning', label: 'Learning Programs', hint: 'Career tracks', to: '/admin/learning', perm: 'learning.read', group: 'Go to' },
  { id: 'business', label: 'Business Solutions', hint: 'Service pages', to: '/admin/business-solutions', perm: 'business.read', group: 'Go to' },
  { id: 'careers', label: 'Careers', hint: 'Job postings', to: '/admin/careers', perm: 'careers.read', group: 'Go to' },
  { id: 'apps', label: 'Applications', hint: 'Candidate submissions', to: '/admin/applications', perm: 'applications.read', group: 'Go to', badge: 'applications' },
  { id: 'content', label: 'Website Content', hint: 'Home and page copy', to: '/admin/content', perm: 'home.update', group: 'Go to' },
  { id: 'messages', label: 'Messages', hint: 'Contact enquiries', to: '/admin/messages', perm: 'contact.read', group: 'Go to', badge: 'messages' },
  { id: 'admins', label: 'Admins', hint: 'Team and permissions', to: '/admin/admins', perm: 'admin.read', group: 'Go to' },

  { id: 'new-mou', label: 'New MOU', hint: 'Add to the directory', to: '/admin/mous/create', perm: 'mou.create', group: 'Create' },
  { id: 'new-csr', label: 'New CSR Project', hint: 'Add a project', to: '/admin/csr/create', perm: 'csr.create', group: 'Create' },
  { id: 'new-learning', label: 'New Learning Program', hint: 'Add a track', to: '/admin/learning/create', perm: 'learning.create', group: 'Create' },
  { id: 'new-business', label: 'New Business Solution', hint: 'Add a service page', to: '/admin/business-solutions/create', perm: 'business.create', group: 'Create' },
  { id: 'new-career', label: 'New Job Posting', hint: 'Open a role', to: '/admin/careers/create', perm: 'careers.create', group: 'Create' },

  { id: 'password', label: 'Change Password', hint: 'Update your credentials', to: '/admin/change-password', group: 'Account' },
];

/** Subsequence match, so "mou dir" and "mdir" both find the MOU Directory. */
function score(query, text) {
  if (!query) return 0;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  const direct = t.indexOf(q);
  if (direct === 0) return 1000;
  if (direct > 0) return 800 - direct;
  let qi = 0;
  let hits = 0;
  for (let i = 0; i < t.length && qi < q.length; i += 1) {
    if (t[i] === q[qi]) { qi += 1; hits += 1; }
  }
  return qi === q.length ? 300 + hits : -1;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const navigate = useNavigate();
  const { hasPermission, logout } = useAuth();
  const { theme, toggle } = useAdminTheme();
  const { newMessages, newApplications } = useNotifications();
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const close = useCallback(() => { setOpen(false); setQuery(''); setCursor(0); }, []);

  const items = useMemo(() => {
    const counts = { messages: newMessages, applications: newApplications };
    const base = ACTIONS
      .filter((a) => !a.perm || hasPermission(a.perm))
      .map((a) => ({ ...a, count: a.badge ? counts[a.badge] : 0 }));

    base.push(
      { id: 'theme', label: theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme', hint: 'Toggle appearance', group: 'Account', run: toggle },
      { id: 'site', label: 'View Website', hint: 'Open the public site', group: 'Account', run: () => window.open('/', '_blank', 'noopener') },
      { id: 'logout', label: 'Log out', hint: 'End this session', group: 'Account', danger: true, run: async () => { await logout(); navigate('/admin/login'); } },
    );

    if (!query.trim()) return base;
    return base
      .map((a) => ({ a, s: Math.max(score(query.trim(), a.label), score(query.trim(), a.hint || '') - 200) }))
      .filter((x) => x.s > 0)
      .sort((x, y) => y.s - x.s)
      .map((x) => x.a);
  }, [query, hasPermission, theme, toggle, logout, navigate, newMessages, newApplications]);

  // Open with Ctrl/Cmd+K from anywhere in the admin.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    const openIt = () => setOpen(true);
    window.addEventListener('qaroo:palette', openIt);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('qaroo:palette', openIt);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setCursor(0);
      // Focus after the dialog has painted, or the caret lands nowhere.
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, [open]);

  // Keep the highlighted row in view when arrowing past the fold.
  useEffect(() => {
    const el = listRef.current?.querySelector('[data-on="1"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  const run = useCallback((item) => {
    if (!item) return;
    close();
    if (item.run) { item.run(); return; }
    if (item.to) navigate(item.to);
  }, [close, navigate]);

  if (!open) return null;

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => (items.length ? (c + 1) % items.length : 0)); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => (items.length ? (c - 1 + items.length) % items.length : 0)); return; }
    if (e.key === 'Enter') { e.preventDefault(); run(items[cursor]); }
  };

  let lastGroup = null;

  return (
    <div className="ft-cmd" role="dialog" aria-modal="true" aria-label="Command palette">
      <button type="button" className="ft-cmd__scrim" aria-label="Close command palette" onClick={close} />
      <div className="ft-cmd__box" onKeyDown={onKeyDown}>
        <div className="ft-cmd__field">
          <span className="ft-cmd__glyph" aria-hidden="true">⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setCursor(0); }}
            placeholder="Jump to a section, create a record, change a setting..."
            aria-label="Search commands"
            autoComplete="off"
            spellCheck="false"
          />
          <kbd>esc</kbd>
        </div>

        <div className="ft-cmd__list" ref={listRef} role="listbox" aria-label="Commands">
          {items.length === 0 && <p className="ft-cmd__none">Nothing matches &ldquo;{query}&rdquo;.</p>}
          {items.map((item, i) => {
            const head = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            return (
              <div key={item.id}>
                {head && <div className="ft-cmd__group">{head}</div>}
                <button
                  type="button"
                  role="option"
                  aria-selected={cursor === i}
                  data-on={cursor === i ? '1' : '0'}
                  className={`ft-cmd__item${cursor === i ? ' is-on' : ''}${item.danger ? ' is-danger' : ''}`}
                  onMouseMove={() => setCursor(i)}
                  onClick={() => run(item)}
                >
                  <span className="ft-cmd__label">{item.label}</span>
                  <span className="ft-cmd__hint">{item.hint}</span>
                  {item.count > 0 && <span className="ft-cmd__count">{item.count}</span>}
                  <span className="ft-cmd__go" aria-hidden="true">↵</span>
                </button>
              </div>
            );
          })}
        </div>

        <div className="ft-cmd__foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>ctrl</kbd>+<kbd>K</kbd> toggle</span>
        </div>
      </div>
    </div>
  );
}
