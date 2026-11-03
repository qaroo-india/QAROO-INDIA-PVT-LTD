import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api/authApi.js';
import PasswordInput from '../components/forms/PasswordInput.jsx';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!token) {
      setError('Reset token is missing. Please use the link from your email.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.resetPassword(token, password);
      setInfo(res.message || 'Password reset successfully. You can now log in.');
    } catch (err) {
      setError(err.message || 'Reset failed. The link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-auth-page">
      <div className="admin-auth-card">
        <div className="brand">
          <Link to="/" className="brand-logo" title="Qaroo India Private Limited" aria-label="Go to Qaroo website">
            <img src="/logos/qaroo-logo.jpg" alt="Qaroo India" />
          </Link>
          <h1>Reset Password</h1>
          <p>Choose a new password for your admin account</p>
        </div>

        {error && <div className="admin-alert error">{error}</div>}
        {info && <div className="admin-alert success">{info}</div>}

        {!token && !info && (
          <div className="admin-alert error">Reset token is missing. Please use the link from your email.</div>
        )}

        {token && !info && (
          <form onSubmit={handleSubmit}>
            <PasswordInput
              label="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              placeholder="Min 8 characters"
              disabled={loading}
            />
            <PasswordInput
              label="Confirm New Password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
              placeholder="Re-enter new password"
              disabled={loading}
            />
            <button type="submit" className="admin-btn" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="admin-foot">
          <Link to="/admin/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
