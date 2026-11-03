import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/authApi.js';
import PasswordInput from '../components/forms/PasswordInput.jsx';

export default function AdminRegister() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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
      const res = await authApi.register({ name, email, password });
      setSuccess(res.message || 'Registration successful');
    } catch (err) {
      setError(err.message || 'Registration failed');
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
          <h1>Request Admin Access</h1>
          <p>Register and await Super Admin approval</p>
        </div>

        {error && <div className="admin-alert error">{error}</div>}
        {success && <div className="admin-alert success">{success}</div>}

        {!success && (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="John Doe" />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>
            <PasswordInput
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Min 8 characters"
            />
            <PasswordInput
              label="Confirm Password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              placeholder="Re-enter password"
            />
            <button type="submit" className="admin-btn" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
        )}

        <div className="admin-foot">
          Already registered? <Link to="/admin/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
