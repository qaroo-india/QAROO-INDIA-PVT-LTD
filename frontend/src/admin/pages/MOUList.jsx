import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { mouApi } from '../../api/mouApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import PermissionGuard from '../components/PermissionGuard.jsx';
import DetailModal from '../components/DetailModal.jsx';
import RecordView from '../components/RecordView.jsx';
import { ShimmerPanel, EmptyState, ErrorState } from '../../components/ui/States';
import { useToast } from '../../context/ToastContext';

const VIEW_LABELS = [
  ['name', 'MOU name'],
  ['tag', 'Category'],
  ['status', 'Status'],
  ['blurb', 'Blurb'],
  ['sections', 'Sections'],
  ['createdAt', 'Created'],
  ['updatedAt', 'Updated'],
];

export default function MOUList() {
  const { hasPermission } = useAuth();
  const [mous, setMous] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState('all');
  const [error, setError] = useState('');
  const [viewId, setViewId] = useState(null);
  const toast = useToast();

  const fetchMous = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await mouApi.list({ search, status });
      setMous(res.data.mous || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    fetchMous();
  }, [fetchMous]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const view = mous.find((m) => m._id === viewId) || null;

  const handleDelete = async (mou) => {
    if (!window.confirm(`Are you sure you want to delete this MOU?\n\n${mou.name}`)) return;
    try {
      await mouApi.remove(mou._id);
      toast.success(`Deleted "${mou.name}".`);
      fetchMous();
    } catch (err) {
      toast.error(err.message || 'Delete failed. Please try again.');
      setError(err.message || 'Delete failed. Please try again.');
    }
  };

  const handlePublish = async (mou) => {
    try {
      await mouApi.togglePublish(mou._id);
      toast.success(mou.status === 'published' ? `Unpublished "${mou.name}".` : `Published "${mou.name}".`);
      fetchMous();
    } catch (err) {
      toast.error(err.message || 'Publish failed. Please try again.');
      setError(err.message || 'Publish failed. Please try again.');
    }
  };

  const fmt = (d) => (d ? new Date(d).toLocaleDateString() : '-');

  return (
    <PermissionGuard permission="mou.read">
      <h1>MOU Directory</h1>
      <p className="page-sub">Manage memorandums of understanding shown on the public website.</p>

      <div className="admin-card admin-filter-bar">
        <input
          type="text"
          placeholder="Search MOUs..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="admin-filter admin-filter--grow"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="admin-filter">
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        {(searchInput || status !== 'all') && (
          <button
            type="button"
            className="admin-btn outline"
            onClick={() => { setSearchInput(''); setSearch(''); setStatus('all'); }}
          >
            Clear
          </button>
        )}
        {hasPermission('mou.create') && (
          <Link to="/admin/mous/create" className="admin-btn">+ Add MOU</Link>
        )}
      </div>

      {error && <div className="admin-alert error">{error}</div>}

      {!loading && !error && (
        <p className="admin-filter-meta">
          Showing <strong>{mous.length}</strong> MOU{mous.length === 1 ? '' : 's'}
          {search || status !== 'all' ? ' matching the current filters' : ''}
        </p>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>MOU Name</th>
              <th>Category</th>
              <th>Status</th>
              <th>Created</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6"><ShimmerPanel variant="table" header={false} /></td></tr>
            ) : error ? (
              <tr><td colSpan="6"><ErrorState compact title="Couldn't load MOUs" text={error} onRetry={fetchMous} /></td></tr>
            ) : mous.length === 0 ? (
              <tr><td colSpan="6"><EmptyState compact title="No MOUs found" text="Add your first MOU to start building the public directory." /></td></tr>
            ) : (
              mous.map((m) => (
                <tr key={m._id}>
                  <td><strong>{m.name}</strong></td>
                  <td>{m.tag}</td>
                  <td>
                    <span className={`admin-badge ${m.status === 'published' ? 'green' : 'grey'}`}>{m.status}</span>
                  </td>
                  <td>{fmt(m.createdAt)}</td>
                  <td>{fmt(m.updatedAt)}</td>
                  <td>
                    <div className="actions">
                      <button type="button" className="admin-icon-btn act-view" onClick={() => setViewId(m._id)}>View</button>
                      {hasPermission('mou.update') && (
                        <>
                          <button type="button" className="admin-icon-btn act-publish" onClick={() => handlePublish(m)}>
                            {m.status === 'published' ? 'Unpublish' : 'Publish'}
                          </button>
                          <Link to={`/admin/mous/${m._id}/edit`} className="admin-icon-btn act-edit">Edit</Link>
                        </>
                      )}
                      {hasPermission('mou.delete') && (
                        <button type="button" className="admin-icon-btn danger" onClick={() => handleDelete(m)}>Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <DetailModal show={!!viewId} onHide={() => setViewId(null)} title="MOU details" subtitle={view?.name}>
        {view && <RecordView record={view} labels={VIEW_LABELS} />}
      </DetailModal>
    </PermissionGuard>
  );
}