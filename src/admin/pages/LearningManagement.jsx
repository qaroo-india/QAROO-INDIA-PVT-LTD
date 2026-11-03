import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { learningApi } from '../../api/learningApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import PermissionGuard from '../components/PermissionGuard.jsx';
import DetailModal from '../components/DetailModal.jsx';
import RecordView from '../components/RecordView.jsx';
import { ShimmerPanel, EmptyState, ErrorState } from '../../components/ui/States';
import { useToast } from '../../context/ToastContext';

const VIEW_LABELS = [
  ['title', 'Title'],
  ['slug', 'Slug'],
  ['category', 'Category'],
  ['status', 'Status'],
  ['shortDescription', 'Short description'],
  ['fullDescription', 'Full description'],
  ['skills', 'Skills'],
  ['image', 'Image'],
  ['highlights', 'Highlights'],
  ['learn', 'What you learn'],
  ['tools', 'Tools'],
  ['modules', 'Modules'],
  ['careers', 'Career outcomes'],
  ['audience', 'Who it is for'],
  ['benefits', 'Benefits'],
  ['certification', 'Certification'],
  ['placement', 'Placement'],
  ['modes', 'Modes'],
  ['faq', 'FAQ'],
  ['cta', 'Call to action'],
  ['keyword', 'Keyword'],
  ['seoTitle', 'SEO title'],
  ['seoDescription', 'SEO description'],
  ['displayOrder', 'Display order'],
  ['createdAt', 'Created'],
  ['updatedAt', 'Updated'],
];

export default function LearningManagement() {
  const { hasPermission } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [viewId, setViewId] = useState(null);
  const toast = useToast();

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { const res = await learningApi.list({ search }); setPrograms(res.data.programs || []); }
    catch (err) { setError(err?.message || 'Could not load programs.'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchPrograms(); }, [fetchPrograms]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const view = programs.find((p) => p._id === viewId) || null;

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete program "${p.title}"?`)) return;
    try {
      await learningApi.remove(p._id);
      toast.success(`Deleted "${p.title}".`);
      fetchPrograms();
    } catch (err) {
      toast.error(err.message || 'Delete failed. Please try again.');
    }
  };
  const handlePublish = async (p) => {
    try {
      await learningApi.togglePublish(p._id);
      toast.success(p.status === 'published' ? `Unpublished "${p.title}".` : `Published "${p.title}".`);
      fetchPrograms();
    } catch (err) {
      toast.error(err.message || 'Publish failed. Please try again.');
    }
  };

  return (
    <PermissionGuard permission="learning.read">
      <h1>Learning Programs</h1>
      <p className="page-sub">Manage learning programs / career tracks.</p>

      <div className="admin-card admin-filter-bar">
        <input type="text" placeholder="Search programs..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
          className="admin-filter admin-filter--grow" />
        {searchInput && (
          <button type="button" className="admin-btn outline"
            onClick={() => { setSearchInput(''); setSearch(''); }}>
            Clear
          </button>
        )}
        {hasPermission('learning.create') && <Link to="/admin/learning/create" className="admin-btn">+ Add Program</Link>}
      </div>

      {!loading && !error && (
        <p className="admin-filter-meta">
          Showing <strong>{programs.length}</strong> program{programs.length === 1 ? '' : 's'}
          {search ? ' matching the current filters' : ''}
        </p>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Title</th><th>Category</th><th>Skills</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="5"><ShimmerPanel variant="table" header={false} /></td></tr>
            : error ? <tr><td colSpan="5"><ErrorState compact title="Couldn't load programs" text={error} onRetry={fetchPrograms} /></td></tr>
            : programs.length === 0 ? <tr><td colSpan="5"><EmptyState compact title="No programs yet" text="Add your first learning program to start building the public career tracks." /></td></tr>
            : programs.map((p) => (
              <tr key={p._id}>
                <td><strong>{p.title}</strong></td>
                <td>{p.category || '-'}</td>
                <td><span style={{ fontSize: '12px' }}>{(p.skills || []).join(', ') || '-'}</span></td>
                <td><span className={`admin-badge ${p.status === 'published' ? 'green' : 'grey'}`}>{p.status}</span></td>
                <td>
                  <div className="actions">
                    <button type="button" className="admin-icon-btn act-view" onClick={() => setViewId(p._id)}>View</button>
                    {hasPermission('learning.update') && (
                      <>
                        <button type="button" className="admin-icon-btn act-publish" onClick={() => handlePublish(p)}>{p.status === 'published' ? 'Unpublish' : 'Publish'}</button>
                        <Link to={`/admin/learning/${p._id}/edit`} className="admin-icon-btn act-edit">Edit</Link>
                      </>
                    )}
                    {hasPermission('learning.delete') && <button type="button" className="admin-icon-btn danger" onClick={() => handleDelete(p)}>Delete</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DetailModal show={!!viewId} onHide={() => setViewId(null)} title="Learning program details" subtitle={view?.title}>
        {view && <RecordView record={view} labels={VIEW_LABELS} />}
      </DetailModal>
    </PermissionGuard>
  );
}