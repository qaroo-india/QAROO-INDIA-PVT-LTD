import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import PasswordInput from '../components/forms/PasswordInput.jsx';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const dest = location.state?.from || '/admin/dashboard';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const goBackToWebsite = () => {
    // If this tab was opened from the public site, close it to return to the
    // previous tab. Otherwise (opened directly) fall back to the homepage.
    window.close();
    if (!window.closed) {
      window.location.href = '/';
    }
  };

  return (
    <div className="admin-auth-page">
      <div className="admin-auth-card">
        <button type="button" onClick={goBackToWebsite} className="admin-auth-back" title="Back to website" aria-label="Back to website">{'<- Back to website'}</button>

        <div className="brand">
          <Link to="/" className="brand-logo" title="Qaroo India Private Limited" aria-label="Go to Qaroo website">
            <img src="/logos/qaroo-logo.jpg" alt="Qaroo India" />
          </Link>
          <h1>Qaroo India Private Limited</h1>
          <p>Admin Login - Manage website content</p>
        </div>

        {error && <div className="admin-alert error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="support@qaroo.in"
            />
          </div>
          <PasswordInput
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
          <div className="admin-auth-forgot">
            <Link to="/admin/forgot-password">Forgot password?</Link>
          </div>
          <button type="submit" className="admin-btn" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="admin-foot">
          New here? <Link to="/admin/register">Request admin access</Link>
        </div>
      </div>
    </div>
  );
}
