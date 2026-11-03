import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/adminApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import PermissionGuard from '../components/PermissionGuard.jsx';
import PasswordInput from '../components/forms/PasswordInput.jsx';
import DetailModal from '../components/DetailModal.jsx';
import RecordView from '../components/RecordView.jsx';
import { ShimmerPanel, EmptyState, ErrorState } from '../../components/ui/States';
import { useToast } from '../../context/ToastContext';

const VIEW_LABELS = [
  ['name', 'Name'],
  ['email', 'Email'],
  ['role', 'Role'],
  ['isEmailVerified', 'Email verified'],
  ['isApproved', 'Approved'],
  ['isDisabled', 'Disabled'],
  ['permissions', 'Permissions'],
  ['createdAt', 'Created'],
  ['updatedAt', 'Updated'],
];

const PERM_GROUPS = [
  { label: 'Dashboard', perms: [{ k: 'dashboard.view', label: 'View Dashboard' }] },
  {
    label: 'MOU',
    perms: [
      { k: 'mou.create', label: 'Create' },
      { k: 'mou.read', label: 'View' },
      { k: 'mou.update', label: 'Update' },
      { k: 'mou.delete', label: 'Delete' },
    ],
  },
  {
    label: 'CSR',
    perms: [
      { k: 'csr.create', label: 'Create' },
      { k: 'csr.read', label: 'View' },
      { k: 'csr.update', label: 'Update' },
      { k: 'csr.delete', label: 'Delete' },
    ],
  },
  {
    label: 'Learning',
    perms: [
      { k: 'learning.create', label: 'Create' },
      { k: 'learning.read', label: 'View' },
      { k: 'learning.update', label: 'Update' },
      { k: 'learning.delete', label: 'Delete' },
    ],
  },
  {
    label: 'Business Solutions',
    perms: [
      { k: 'business.create', label: 'Create' },
      { k: 'business.read', label: 'View' },
      { k: 'business.update', label: 'Update' },
      { k: 'business.delete', label: 'Delete' },
    ],
  },
  {
    label: 'Careers',
    perms: [
      { k: 'careers.create', label: 'Create' },
      { k: 'careers.read', label: 'View' },
      { k: 'careers.update', label: 'Update' },
      { k: 'careers.delete', label: 'Delete' },
    ],
  },
  {
    label: 'Job Applications',
    perms: [
      { k: 'applications.read', label: 'View' },
      { k: 'applications.update', label: 'Update status' },
      { k: 'applications.delete', label: 'Delete' },
    ],
  },
  {
    label: 'Website Content',
    perms: [
      { k: 'home.update', label: 'Home' },
      { k: 'about.update', label: 'About' },
      { k: 'learning.update', label: 'Learning' },
      { k: 'csr.update', label: 'CSR' },
      { k: 'mou.update', label: 'MOU' },
      { k: 'contact.update', label: 'Contact' },
      { k: 'footer.update', label: 'Footer' },
    ],
  },
  {
    label: 'Contact Messages',
    perms: [
      { k: 'contact.read', label: 'View' },
      { k: 'contact.delete', label: 'Delete' },
    ],
  },
  {
    label: 'Admin Management',
    perms: [
      { k: 'admin.create', label: 'Create' },
      { k: 'admin.read', label: 'View' },
      { k: 'admin.update', label: 'Update' },
      { k: 'admin.delete', label: 'Delete' },
      { k: 'permissions.manage', label: 'Manage Permissions' },
    ],
  },
];

function PermissionEditor({ admin, onClose }) {
  const [selected, setSelected] = useState(() => new Set(admin.permissions || []));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const toast = useToast();

  const toggle = (k) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await adminApi.setPermissions(admin._id, [...selected]);
      setSaved(true);
      toast.success(`Permissions updated for ${admin.name}.`);
      setTimeout(onClose, 900);
    } catch (err) {
      toast.error(err.message || 'Could not save permissions.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-card">
      <div className="admin-section-title">
        <span>Edit Permissions - {admin.name}</span>
        <button className="admin-icon-btn" onClick={onClose}>Close</button>
      </div>
      {saved && <div className="admin-alert success">Permissions saved ✓</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
        {PERM_GROUPS.map((g) => (
          <div key={g.label}>
            <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--admin-dark)', fontSize: '14px' }}>{g.label}</strong>
            {g.perms.map((p) => (
              <label key={p.k} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '13.5px', cursor: 'pointer' }}>
                <input type="checkbox" checked={selected.has(p.k)} onChange={() => toggle(p.k)} />
                {p.label}
              </label>
            ))}
          </div>
        ))}
      </div>
      <div style={{ marginTop: '18px' }}>
        <button className="admin-btn" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Permissions'}</button>
      </div>
    </div>
  );
}

function CreateAdminForm({ onDone, onCancel }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      const res = await adminApi.create({ name, email, password, role });
      onDone(
        `${res.message || 'Admin created. A verification code has been sent.'} Click Verify on the new user below and enter the 6-digit code emailed to you.`
      );
    } catch (err) {
      setError(err.message || 'Failed to create admin');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-card" style={{ marginTop: '16px' }}>
      <div className="admin-section-title">
        <span>Create New User</span>
        <button className="admin-icon-btn" onClick={onCancel}>Cancel</button>
      </div>
      <p className="hint" style={{ marginBottom: '16px' }}>
        A 6-digit code will be emailed to <strong>you</strong>. After creating the user, click <strong>Verify</strong> on
        their row and enter that code to confirm them.
      </p>
      {error && <div className="admin-alert error">{error}</div>}
      <form className="admin-form" onSubmit={submit} style={{ maxWidth: '480px' }}>
        <div className="form-grid">
          <div className="field">
            <label>Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="John Doe" />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="user@example.com" />
          </div>
        </div>
        <div className="form-grid">
          <PasswordInput
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Min 8 characters"
            hint="Minimum 8 characters."
          />
          <div className="field">
            <label>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>
        </div>
        <div className="actions" style={{ marginTop: '6px' }}>
          <button type="submit" className="admin-btn" disabled={saving}>
            {saving ? 'Creating...' : 'Create User'}
          </button>
          <button type="button" className="admin-icon-btn" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

function VerifyEditor({ admin, onDone, onCancel }) {
  const [otp, setOtp] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 4000);
    return () => clearTimeout(t);
  }, [error]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await adminApi.verify(admin._id, otp.trim());
      onDone(res.message || `${admin.name} is now verified.`);
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-card">
      <div className="admin-section-title">
        <span>Verify - {admin.name} ({admin.email})</span>
        <button className="admin-icon-btn" onClick={onCancel}>Cancel</button>
      </div>
      <p className="hint" style={{ marginBottom: '14px' }}>
        Enter the 6-digit code that was emailed to <strong>you</strong> when this user was created.
      </p>
      {error && <div className="admin-alert error">{error}</div>}
      <form className="admin-form" onSubmit={submit} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>6-digit code</label>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            required
            placeholder="••••••"
            style={{ width: '150px', letterSpacing: '6px', fontSize: '20px', textAlign: 'center' }}
          />
        </div>
        <button type="submit" className="admin-btn" disabled={saving}>
          {saving ? 'Verifying...' : 'Confirm'}
        </button>
      </form>
    </div>
  );
}

export default function AdminManagement() {
  const { hasPermission } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editor, setEditor] = useState(null);
  const [verifyFor, setVerifyFor] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState('');
  const [verifyMsg, setVerifyMsg] = useState('');
  const [viewId, setViewId] = useState(null);
  const toast = useToast();

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { const res = await adminApi.list(); setAdmins(res.data.admins || []); }
    catch (err) { setError(err?.message || 'Could not load admins.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  const act = async (fn, msg, successMsg) => {
    if (msg && !window.confirm(msg)) return;
    try { await fn(); if (successMsg) toast.success(successMsg); fetchAdmins(); }
    catch (err) { toast.error(err?.message || 'Action failed.'); }
  };

  const sendCode = async (a) => {
    try {
      const res = await adminApi.sendOtp(a._id);
      toast.success(res.message || 'Verification code sent to your email.');
    } catch (err) {
      toast.error(err.message || 'Could not send the verification code.');
    }
  };

  const statusBadge = (a) => {
    if (!a.isEmailVerified) return <span className="admin-badge red">Unverified</span>;
    if (!a.isApproved) return <span className="admin-badge yellow">Pending</span>;
    if (a.isDisabled) return <span className="admin-badge grey">Disabled</span>;
    return <span className="admin-badge green">Active</span>;
  };

  const view = admins.find((a) => a._id === viewId) || null;

  return (
    <PermissionGuard permission="admin.read">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1>Admin Management</h1>
          <p className="page-sub">Approve, disable, delete and manage admin permissions (Super Admin only).</p>
        </div>
        {hasPermission('admin.create') && !creating && (
          <button className="admin-btn" onClick={() => setCreating(true)}>+ Add New User</button>
        )}
      </div>

      {creating && (
        <CreateAdminForm
          onDone={(msg) => { setCreateMsg(msg); setCreating(false); toast.success(msg); fetchAdmins(); }}
          onCancel={() => setCreating(false)}
        />
      )}

      {createMsg && (
        <div className="admin-alert success" style={{ margin: '14px 0 0' }}>{createMsg}</div>
      )}

      <div className="admin-card" style={{ marginTop: '16px', padding: '12px 16px', fontSize: '13.5px' }}>
        <strong style={{ color: 'var(--admin-dark)' }}>Email verification</strong>
        {' '}
        <span style={{ color: 'var(--admin-muted)' }}>
          - when you create a user, the 6-digit code is emailed to <strong>you</strong>. Click <strong>Verify</strong> on
          the user's row to enter the code and confirm them. Use <strong>Send Code</strong> to email a new code to yourself.
        </span>
      </div>

      <div className="admin-table-wrap" style={{ marginTop: '16px' }}>
        <table className="admin-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Verification</th><th>Permissions</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="7"><ShimmerPanel variant="table" header={false} /></td></tr>
            : error ? <tr><td colSpan="7"><ErrorState compact title="Couldn't load admins" text={error} onRetry={fetchAdmins} /></td></tr>
            : admins.length === 0 ? <tr><td colSpan="7"><EmptyState compact title="No users yet" text="Create your first admin user to start collaborating on the CMS." /></td></tr>
            : admins.map((a) => (
              <tr key={a._id}>
                <td><strong>{a.name}</strong></td>
                <td>{a.email}</td>
                <td><span className={`admin-badge ${a.role === 'superadmin' ? 'yellow' : 'blue'}`}>{a.role}</span></td>
                <td>{statusBadge(a)}</td>
                <td>
                  <div className="actions" style={{ justifyContent: 'flex-start' }}>
                    <span className={`admin-badge ${a.isEmailVerified ? 'green' : 'red'}`}>{a.isEmailVerified ? 'Verified' : 'Unverified'}</span>
                    {!a.isEmailVerified && (
                      <>
                        <button className="admin-icon-btn" onClick={() => setVerifyFor(a)}>Verify</button>
                        <button className="admin-icon-btn" onClick={() => sendCode(a)}>Send Code</button>
                      </>
                    )}
                  </div>
                </td>
                <td style={{ maxWidth: '220px' }}>
                  <span style={{ fontSize: '12px' }}>{a.role === 'superadmin' ? 'All permissions' : (a.permissions?.length || 0) + ' permissions'}</span>
                </td>
                <td>
                  <div className="actions">
                    <button type="button" className="admin-icon-btn act-view" onClick={() => setViewId(a._id)}>View</button>
                    {a.role !== 'superadmin' && (
                      <>
                        {!a.isApproved && <button className="admin-icon-btn success" onClick={() => act(() => adminApi.approve(a._id), null, `${a.name} approved.`)}>Approve</button>}
                        {a.isApproved && <button className="admin-icon-btn" onClick={() => act(() => adminApi.reject(a._id), null, `${a.name} rejected.`)}>Reject</button>}
                        <button className="admin-icon-btn" onClick={() => act(() => adminApi.toggleDisable(a._id), a.isDisabled ? 'Enable this admin?' : 'Disable this admin?', a.isDisabled ? `${a.name} enabled.` : `${a.name} disabled.`)}>
                          {a.isDisabled ? 'Enable' : 'Disable'}
                        </button>
                        <button className="admin-icon-btn" onClick={() => setEditor(a)}>Permissions</button>
                        <button className="admin-icon-btn danger" onClick={() => act(() => adminApi.remove(a._id), `Delete admin ${a.name}?`, `${a.name} deleted.`)}>Delete</button>
                      </>
                    )}
                    {a.role === 'superadmin' && <span style={{ fontSize: '12px', color: 'var(--admin-muted)' }}>System</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {verifyMsg && (
        <div className="admin-alert success" style={{ marginTop: '16px' }}>{verifyMsg}</div>
      )}

      {editor && <PermissionEditor admin={editor} onClose={() => setEditor(null)} />}
      {verifyFor && (
        <VerifyEditor
          admin={verifyFor}
          onDone={(msg) => { setVerifyMsg(msg); setVerifyFor(null); toast.success(msg); fetchAdmins(); }}
          onCancel={() => setVerifyFor(null)}
        />
      )}

      <DetailModal show={!!viewId} onHide={() => setViewId(null)} title="Admin user details" subtitle={view?.name}>
        {view && <RecordView record={view} labels={VIEW_LABELS} exclude={['passwordHash', 'otpCode', 'otpExpires']} />}
      </DetailModal>
    </PermissionGuard>
  );
}
