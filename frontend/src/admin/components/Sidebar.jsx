import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';

const items = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: '▦', permission: 'dashboard.view' },
  { to: '/admin/mous', label: 'MOU Directory', icon: 'M', permission: 'mou.read' },
  { to: '/admin/csr', label: 'CSR Projects', icon: 'C', permission: 'csr.read' },
  { to: '/admin/learning', label: 'Learning Programs', icon: 'L', permission: 'learning.read' },
  { to: '/admin/business-solutions', label: 'Business Solutions', icon: 'B', permission: 'business.read' },
  { to: '/admin/careers', label: 'Careers', icon: '◆', permission: 'careers.read' },
  { to: '/admin/applications', label: 'Applications', icon: '⤓', permission: 'applications.read', badge: 'applications' },
  { to: '/admin/content', label: 'Website Content', icon: '◎', permission: 'home.update' },
  { to: '/admin/messages', label: 'Messages', icon: '✉', permission: 'contact.read', badge: 'messages' },
  { to: '/admin/admins', label: 'Admins', icon: '👤', permission: 'admin.read' },
];

export default function Sidebar({ onNavigate }) {
  const { hasPermission } = useAuth();
  const { newMessages, newApplications } = useNotifications();
  // Unread counts, keyed by the item's `badge`.
  const counts = { messages: newMessages, applications: newApplications };

  const visible = items.filter((it) => hasPermission(it.permission));
  // If none visible, still show dashboard for superadmin-like access
  if (visible.length === 0) visible.push(items[0]);

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <img
          src="/logos/qaroo-logo.jpg"
          alt="Qaroo India"
          style={{ height: '34px', width: 'auto', objectFit: 'contain', borderRadius: '8px', background: '#fff', padding: '5px 10px' }}
        />
        <div>
          <strong>Qaroo India</strong>
          <span className="admin-sub">Private Limited</span>
        </div>
      </div>
      <nav className="admin-sidebar-nav">
        {visible.map((it) => {
          const count = it.badge ? counts[it.badge] : 0;
          return (
            <NavLink
              key={it.to}
              to={it.to}
              onClick={onNavigate}
              className={({ isActive }) => 'admin-nav-link' + (isActive ? ' active' : '')}
            >
              <span className="admin-nav-icon">{it.icon}</span>
              <span className="admin-nav-label">{it.label}</span>
              {count > 0 && (
                <span className="admin-nav-badge" title={`${count} new`}>{count}</span>
              )}
            </NavLink>
          );
        })}
        <NavLink
          to="/admin/change-password"
          onClick={onNavigate}
          className={({ isActive }) => 'admin-nav-link' + (isActive ? ' active' : '')}
        >
          <span className="admin-nav-icon">⌂</span>
          <span className="admin-nav-label">Change Password</span>
        </NavLink>
      </nav>
    </aside>
  );
}
