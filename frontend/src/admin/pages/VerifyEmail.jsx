import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api/authApi.js';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing. Please check your email link.');
      return;
    }
    authApi
      .verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.message || 'Email verified successfully');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || 'Email verification failed');
      });
  }, [token]);

  return (
    <div className="admin-auth-page">
      <div className="admin-auth-card">
        <div className="brand">
          <Link to="/" className="brand-logo" title="Qaroo India Private Limited" aria-label="Go to Qaroo website">
            <img src="/logos/qaroo-logo.jpg" alt="Qaroo India" />
          </Link>
          <h1>Email Verification</h1>
        </div>

        {status === 'loading' && (
          <>
            <div className="admin-spinner"></div>
            <p className="admin-foot" style={{ marginTop: '16px' }}>Verifying your email...</p>
          </>
        )}

        {status === 'success' && (
          <div className="admin-alert success">{message}</div>
        )}
        {status === 'error' && (
          <div className="admin-alert error">{message}</div>
        )}

        {status !== 'loading' && (
          <div className="admin-foot">
            Your account still needs Super Admin approval before you can sign in.
            <br />
            <Link to="/admin/login">Back to Login</Link>
          </div>
        )}
      </div>
    </div>
  );
}
