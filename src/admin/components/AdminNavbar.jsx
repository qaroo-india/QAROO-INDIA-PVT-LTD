import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import { useAdminTheme } from '../context/AdminThemeContext.jsx';

export default function AdminNavbar({ onMenuClick }) {
  const { admin, logout, hasPermission } = useAuth();
  const { theme, toggle } = useAdminTheme();
  const navigate = useNavigate();
  const { newMessages, newApplications } = useNotifications();
  const inBeta = import.meta.env.VITE_BETA_MODE === 'true';

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <header className="admin-topbar">
      <button className="admin-menu-btn" onClick={onMenuClick} aria-label="Toggle navigation menu">☰</button>
      <div className="admin-topbar-title">Admin Panel</div>
      <button
        type="button"
        className="admin-cmd-trigger"
        onClick={() => window.dispatchEvent(new CustomEvent('qaroo:palette'))}
        title="Search and jump to any section (Ctrl+K)"
      >
        <span aria-hidden="true">⌕</span>
        <span className="admin-cmd-trigger__text">Search or jump to...</span>
        <kbd>Ctrl</kbd><kbd>K</kbd>
      </button>
      <div className="admin-topbar-right">
        {inBeta && <span className="admin-badge yellow" title="Beta build - set VITE_BETA_MODE=true in your .env to show/hide">Beta</span>}
        <button
          className="admin-theme-toggle"
          onClick={toggle}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark'
            ? <span aria-hidden="true">☀️</span>
            : <span aria-hidden="true">🌙</span>}
        </button>
        {/* Shown only when there is something new, so an empty icon never
            reads as an unread count of nothing. */}
        {hasPermission('applications.read') && newApplications > 0 && (
          <Link
            to="/admin/applications"
            className="admin-outline-btn"
            title={`${newApplications} new application${newApplications > 1 ? 's' : ''}`}
            aria-label={`${newApplications} new application${newApplications > 1 ? 's' : ''}`}
          >
            ⤓ <span className="admin-nav-badge">{newApplications}</span>
          </Link>
        )}
        {hasPermission('contact.read') && newMessages > 0 && (
          <Link
            to="/admin/messages"
            className="admin-outline-btn"
            title={`${newMessages} new message${newMessages > 1 ? 's' : ''}`}
            aria-label={`${newMessages} new message${newMessages > 1 ? 's' : ''}`}
          >
            ✉ <span className="admin-nav-badge">{newMessages}</span>
          </Link>
        )}
        <Link to="/" target="_blank" className="admin-outline-btn">View Website</Link>
        <div className="admin-user">
          <span className="admin-avatar">{admin?.name?.charAt(0)?.toUpperCase() || 'A'}</span>
          <div className="admin-user-meta">
            <strong>{admin?.name}</strong>
            <span>{admin?.role === 'superadmin' ? 'Super Admin' : 'Admin'}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="admin-danger-btn">Logout</button>
      </div>
    </header>
  );
}
