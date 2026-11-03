import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { authApi } from '../../api/authApi.js';
import PasswordInput from '../components/forms/PasswordInput.jsx';
import { useToast } from '../../context/ToastContext';

export default function ChangePassword() {
  const { admin, hasPermission, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const uid = useId();
  const [deleting, setDeleting] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const sendCode = async () => {
    setError('');
    setInfo('');
    setSending(true);
    try {
      const res = await authApi.sendPasswordChangeOtp();
      setOtpSent(true);
      setInfo(res.message || 'Verification code sent to your email.');
    } catch (err) {
      setError(err.message || 'Could not send the verification code.');
    } finally {
      setSending(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await authApi.changePassword({ newPassword, otp });
      await logout();
      navigate('/admin/login', { replace: true });
      toast.success('Password changed successfully. Please sign in with your new password.');
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    if (!admin?._id) return;
    const confirmed = window.confirm(
      'Delete your account?\n\nThis permanently removes your admin access to the Qaroo CMS. This cannot be undone.'
    );
    if (!confirmed) return;
    setDeleting(true);
    try {
      await authApi.deleteMe();
      toast.success('Your account has been deleted.');
      await logout();
      navigate('/admin/login', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Could not delete your account. Please contact a Super Admin.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <h1>Change Password</h1>
      <p className="page-sub">
        Change your password. A verification code is emailed to your registered admin email address -
        entering it authorises the change, so your current password is not needed.
      </p>

      <div className="admin-card" style={{ maxWidth: '520px', marginTop: '16px' }}>
        {error && <div className="admin-alert error">{error}</div>}
        {info && <div className="admin-alert success">{info}</div>}

        {!otpSent ? (
          <div>
            <p className="hint" style={{ marginBottom: '14px' }}>
              Click the button below to email a 6-digit verification code to{' '}
              <strong>your registered admin email</strong>. Then enter it along with your new password.
              You will be signed out once the password changes.
            </p>
            <div className="actions">
              <button className="admin-btn" onClick={sendCode} disabled={sending}>
                {sending ? 'Sending...' : 'Send verification code to my email'}
              </button>
            </div>
          </div>
        ) : (
          <form className="admin-form" onSubmit={submit}>
            <div className="form-grid">
              <PasswordInput
                label="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
                placeholder="Min 8 characters"
              />
              <PasswordInput
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                placeholder="Re-enter new password"
              />
            </div>
            <div className="field">
              <label htmlFor={`${uid}-otp`}>6-digit verification code</label>
              <input
                id={`${uid}-otp`}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
                placeholder="••••••"
                style={{ width: '150px', letterSpacing: '6px', fontSize: '20px', textAlign: 'center' }}
              />
              <div className="hint">
                Emailed to your registered admin email. Did not receive it?{' '}
                <button type="button" className="admin-icon-btn" onClick={sendCode} disabled={sending}>
                  Resend
                </button>
              </div>
            </div>
            <div className="actions" style={{ marginTop: '8px' }}>
              <button type="submit" className="admin-btn" disabled={saving}>
                {saving ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        )}
      </div>

      {admin && admin.role !== 'superadmin' && hasPermission('admin.delete') && (
        <div className="admin-card" style={{ maxWidth: '520px', marginTop: '16px', border: '1px solid rgba(179, 38, 45,0.3)' }}>
          <h2 style={{ color: 'var(--admin-base, #B3262D)', fontSize: '17px', marginBottom: '6px' }}>Danger zone</h2>
          <p className="hint" style={{ marginBottom: '14px' }}>
            Permanently delete your admin account and revoke your access to the Qaroo CMS. Only admins (not Super Admins)
            can delete themselves.
          </p>
          <button className="admin-btn danger" onClick={deleteAccount} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete my account'}
          </button>
        </div>
      )}
    </div>
  );
}