import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { businessSolutionApi } from '../../api/businessSolutionApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import PermissionGuard from '../components/PermissionGuard.jsx';
import DetailModal from '../components/DetailModal.jsx';
import RecordView from '../components/RecordView.jsx';
import { ShimmerPanel, EmptyState, ErrorState } from '../../components/ui/States';
import { useToast } from '../../context/ToastContext';

const VIEW_LABELS = [
  ['title', 'Title'],
  ['pageName', 'Page name'],
  ['slug', 'Slug'],
  ['status', 'Status'],
  ['shortDescription', 'Short description'],
  ['fullDescription', 'Full description'],
  ['services', 'Services'],
  ['features', 'Features'],
  ['benefits', 'Benefits'],
  ['useCases', 'Use cases'],
  ['audience', 'Who it is for'],
  ['problems', 'Problems solved'],
  ['solutions', 'Solutions'],
  ['techniques', 'Techniques'],
  ['process', 'Process'],
  ['industries', 'Industries'],
  ['whyChoose', 'Why choose us'],
  ['faq', 'FAQ'],
  ['cta', 'Call to action'],
  ['keyword', 'Keyword'],
  ['seoTitle', 'SEO title'],
  ['seoDescription', 'SEO description'],
  ['displayOrder', 'Display order'],
  ['image', 'Image'],
  ['createdAt', 'Created'],
  ['updatedAt', 'Updated'],
];

export default function BusinessSolutionManagement() {
  const { hasPermission } = useAuth();
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [viewId, setViewId] = useState(null);
  const toast = useToast();

  const fetchSolutions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { const res = await businessSolutionApi.list({ search }); setSolutions(res.data.solutions || []); }
    catch (err) { setError(err?.message || 'Could not load business solutions.'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchSolutions(); }, [fetchSolutions]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const view = solutions.find((s) => s._id === viewId) || null;

  const handleDelete = async (s) => {
    if (!window.confirm(`Delete business solution "${s.title}"?`)) return;
    try {
      await businessSolutionApi.remove(s._id);
      toast.success(`Deleted "${s.title}".`);
      fetchSolutions();
    } catch (err) {
      toast.error(err.message || 'Delete failed. Please try again.');
    }
  };
  const handlePublish = async (s) => {
    try {
      await businessSolutionApi.togglePublish(s._id);
      toast.success(s.status === 'published' ? `Unpublished "${s.title}".` : `Published "${s.title}".`);
      fetchSolutions();
    } catch (err) {
      toast.error(err.message || 'Publish failed. Please try again.');
    }
  };

  return (
    <PermissionGuard permission="business.read">
      <h1>Business Solutions</h1>
      <p className="page-sub">Manage business solutions / services.</p>

      <div className="admin-card admin-filter-bar">
        <input type="text" placeholder="Search solutions..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
          className="admin-filter admin-filter--grow" />
        {searchInput && (
          <button type="button" className="admin-btn outline"
            onClick={() => { setSearchInput(''); setSearch(''); }}>
            Clear
          </button>
        )}
        {hasPermission('business.create') && <Link to="/admin/business-solutions/create" className="admin-btn">+ Add Solution</Link>}
      </div>

      {!loading && !error && (
        <p className="admin-filter-meta">
          Showing <strong>{solutions.length}</strong> solution{solutions.length === 1 ? '' : 's'}
          {search ? ' matching the current filters' : ''}
        </p>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Title</th><th>Slug</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="4"><ShimmerPanel variant="table" header={false} /></td></tr>
            : error ? <tr><td colSpan="4"><ErrorState compact title="Couldn't load solutions" text={error} onRetry={fetchSolutions} /></td></tr>
            : solutions.length === 0 ? <tr><td colSpan="4"><EmptyState compact title="No solutions yet" text="Add your first business solution to start building the public services page." /></td></tr>
            : solutions.map((s) => (
              <tr key={s._id}>
                <td><strong>{s.pageName || s.title}</strong></td>
                <td><code style={{ fontSize: '12px' }}>{s.slug || '-'}</code></td>
                <td><span className={`admin-badge ${s.status === 'published' ? 'green' : 'grey'}`}>{s.status}</span></td>
                <td>
                  <div className="actions">
                    <button type="button" className="admin-icon-btn act-view" onClick={() => setViewId(s._id)}>View</button>
                    {hasPermission('business.update') && (
                      <>
                        <button type="button" className="admin-icon-btn act-publish" onClick={() => handlePublish(s)}>{s.status === 'published' ? 'Unpublish' : 'Publish'}</button>
                        <Link to={`/admin/business-solutions/${s._id}/edit`} className="admin-icon-btn act-edit">Edit</Link>
                      </>
                    )}
                    {hasPermission('business.delete') && <button type="button" className="admin-icon-btn danger" onClick={() => handleDelete(s)}>Delete</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DetailModal show={!!viewId} onHide={() => setViewId(null)} title="Business solution details" subtitle={view?.pageName || view?.title}>
        {view && <RecordView record={view} labels={VIEW_LABELS} />}
      </DetailModal>
    </PermissionGuard>
  );
}