import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Renders children only if the current admin has the permission,
// otherwise shows a 403 message. Backend also enforces permissions.
export default function PermissionGuard({ permission, children }) {
  const { admin, hasPermission } = useAuth();
  if (!admin) return <Navigate to="/admin/login" replace />;
  if (!hasPermission(permission)) {
    return (
      <div className="admin-403">
        <h2>403</h2>
        <p>You do not have permission to view this page.</p>
        <a href="/admin/dashboard" className="admin-btn">Back to Dashboard</a>
      </div>
    );
  }
  return children;
}
