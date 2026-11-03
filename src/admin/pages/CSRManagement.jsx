import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { csrApi } from '../../api/csrApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import PermissionGuard from '../components/PermissionGuard.jsx';
import DetailModal from '../components/DetailModal.jsx';
import RecordView from '../components/RecordView.jsx';
import { ShimmerPanel, EmptyState, ErrorState } from '../../components/ui/States';
import { useToast } from '../../context/ToastContext';

const VIEW_LABELS = [
  ['title', 'Title'],
  ['year', 'Year'],
  ['tag', 'Tag'],
  ['status', 'Status'],
  ['desc', 'Description'],
  ['partner', 'Partner'],
  ['location', 'Location'],
  ['beneficiaries', 'Beneficiaries'],
  ['image', 'Image'],
  ['createdAt', 'Created'],
  ['updatedAt', 'Updated'],
];

export default function CSRManagement() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [year, setYear] = useState('');
  const [viewId, setViewId] = useState(null);
  const toast = useToast();

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await csrApi.list({ search, year: year || undefined });
      setProjects(res.data.projects || []);
    } catch (err) {
      setError(err?.message || 'Could not load projects.');
    }
    finally { setLoading(false); }
  }, [search, year]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const view = projects.find((p) => p._id === viewId) || null;

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete project "${p.title}"?`)) return;
    try {
      await csrApi.remove(p._id);
      toast.success(`Deleted "${p.title}".`);
      fetchProjects();
    } catch (err) {
      toast.error(err.message || 'Delete failed. Please try again.');
    }
  };
  const handlePublish = async (p) => {
    try {
      await csrApi.togglePublish(p._id);
      toast.success(p.status === 'published' ? `Unpublished "${p.title}".` : `Published "${p.title}".`);
      fetchProjects();
    } catch (err) {
      toast.error(err.message || 'Publish failed. Please try again.');
    }
  };

  return (
    <PermissionGuard permission="csr.read">
      <h1>CSR Projects</h1>
      <p className="page-sub">Manage corporate social responsibility projects.</p>

      <div className="admin-card admin-filter-bar">
        <input type="text" placeholder="Search projects..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
          className="admin-filter admin-filter--grow" />
        <select value={year} onChange={(e) => setYear(e.target.value)} className="admin-filter">
          <option value="">All years</option>
          <option value="24-25">24-25</option>
          <option value="25-26">25-26</option>
        </select>
        {(searchInput || year !== '') && (
          <button type="button" className="admin-btn outline"
            onClick={() => { setSearchInput(''); setSearch(''); setYear(''); }}>
            Clear
          </button>
        )}
        {hasPermission('csr.create') && <Link to="/admin/csr/create" className="admin-btn">+ Add Project</Link>}
      </div>

      {!loading && !error && (
        <p className="admin-filter-meta">
          Showing <strong>{projects.length}</strong> project{projects.length === 1 ? '' : 's'}
          {(search || year !== '') ? ' matching the current filters' : ''}
        </p>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Title</th><th>Year</th><th>Tag</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="5"><ShimmerPanel variant="table" header={false} /></td></tr>
            : error ? <tr><td colSpan="5"><ErrorState compact title="Couldn't load projects" text={error} onRetry={fetchProjects} /></td></tr>
            : projects.length === 0 ? <tr><td colSpan="5"><EmptyState compact title="No projects yet" text="Add your first CSR project to start building the public gallery." /></td></tr>
            : projects.map((p) => (
              <tr key={p._id}>
                <td><strong>{p.title}</strong></td>
                <td>{p.year}</td>
                <td>{p.tag}</td>
                <td><span className={`admin-badge ${p.status === 'published' ? 'green' : 'grey'}`}>{p.status}</span></td>
                <td>
                  <div className="actions">
                    <button type="button" className="admin-icon-btn act-view" onClick={() => setViewId(p._id)}>View</button>
                    {hasPermission('csr.update') && (
                      <>
                        <button type="button" className="admin-icon-btn act-publish" onClick={() => handlePublish(p)}>{p.status === 'published' ? 'Unpublish' : 'Publish'}</button>
                        <Link to={`/admin/csr/${p._id}/edit`} className="admin-icon-btn act-edit">Edit</Link>
                      </>
                    )}
                    {hasPermission('csr.delete') && <button type="button" className="admin-icon-btn danger" onClick={() => handleDelete(p)}>Delete</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DetailModal show={!!viewId} onHide={() => setViewId(null)} title="CSR project details" subtitle={view?.title}>
        {view && <RecordView record={view} labels={VIEW_LABELS} />}
      </DetailModal>
    </PermissionGuard>
  );
}