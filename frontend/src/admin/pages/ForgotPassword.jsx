import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/authApi.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      setInfo(res.message || 'If that email exists, a reset link has been sent.');
      setEmail('');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
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
          <h1>Forgot Password</h1>
          <p>Enter your email and we'll send you a reset link</p>
        </div>

        {error && <div className="admin-alert error">{error}</div>}
        {info && <div className="admin-alert success">{info}</div>}

        {!info && (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>
            <button type="submit" className="admin-btn" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className="admin-foot">
          Remembered it? <Link to="/admin/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
