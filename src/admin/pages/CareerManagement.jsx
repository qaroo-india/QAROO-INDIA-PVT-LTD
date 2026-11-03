import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { careerApi } from '../../api/careerApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import PermissionGuard from '../components/PermissionGuard.jsx';
import DetailModal from '../components/DetailModal.jsx';
import RecordView from '../components/RecordView.jsx';
import { ShimmerPanel, EmptyState, ErrorState } from '../../components/ui/States';
import { useToast } from '../../context/ToastContext';

const VIEW_LABELS = [
  ['title', 'Job title'],
  ['pageName', 'Page name'],
  ['slug', 'Slug'],
  ['department', 'Department'],
  ['location', 'Location'],
  ['jobType', 'Job type'],
  ['experience', 'Experience'],
  ['employmentType', 'Employment type'],
  ['status', 'Status'],
  ['overview', 'Overview'],
  ['responsibilities', 'Responsibilities'],
  ['techStack', 'Tech stack'],
  ['requiredSkills', 'Required skills'],
  ['preferredSkills', 'Preferred skills'],
  ['qualifications', 'Qualifications'],
  ['trainingAreas', 'Training areas'],
  ['idealCandidate', 'Ideal candidate'],
  ['benefits', 'Benefits'],
  ['knowledgeAreas', 'Knowledge areas'],
  ['note', 'Note'],
  ['keyword', 'Keyword'],
  ['seoTitle', 'SEO title'],
  ['seoDescription', 'SEO description'],
  ['displayOrder', 'Display order'],
  ['createdAt', 'Created'],
  ['updatedAt', 'Updated'],
];

export default function CareerManagement() {
  const { hasPermission } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [viewId, setViewId] = useState(null);
  const toast = useToast();

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // status:'all' so drafts are listed here, unlike the public page.
      const res = await careerApi.list({ search, status: 'all' });
      setJobs(res.data.jobs || []);
    } catch (err) {
      setError(err?.message || 'Could not load job postings.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const view = jobs.find((j) => j._id === viewId) || null;

  const handleDelete = async (j) => {
    if (!window.confirm(`Delete job posting "${j.title}"?\n\nApplications already received for this role are kept.`)) return;
    try {
      const res = await careerApi.remove(j._id);
      toast.success(res?.message || `Deleted "${j.title}".`);
      fetchJobs();
    } catch (err) {
      toast.error(err.message || 'Delete failed. Please try again.');
    }
  };

  const handlePublish = async (j) => {
    try {
      await careerApi.togglePublish(j._id);
      toast.success(j.status === 'published' ? `Unpublished "${j.title}".` : `Published "${j.title}".`);
      fetchJobs();
    } catch (err) {
      toast.error(err.message || 'Publish failed. Please try again.');
    }
  };

  return (
    <PermissionGuard permission="careers.read">
      <h1>Careers</h1>
      <p className="page-sub">Manage job postings. Only published roles appear on the website.</p>

      <div className="admin-card admin-filter-bar">
        <input
          type="text"
          placeholder="Search roles..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="admin-filter admin-filter--grow"
        />
        {searchInput && (
          <button
            type="button"
            className="admin-btn outline"
            onClick={() => { setSearchInput(''); setSearch(''); }}
          >
            Clear
          </button>
        )}
        {hasPermission('careers.create') && (
          <Link to="/admin/careers/create" className="admin-btn">+ Add Job Posting</Link>
        )}
      </div>

      {!loading && !error && (
        <p className="admin-filter-meta">
          Showing <strong>{jobs.length}</strong> job posting{jobs.length === 1 ? '' : 's'}
          {search ? ' matching the current filters' : ''}
        </p>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Role</th><th>Department</th><th>Slug</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5"><ShimmerPanel variant="table" header={false} /></td></tr>
            ) : error ? (
              <tr><td colSpan="5"><ErrorState compact title="Couldn't load job postings" text={error} onRetry={fetchJobs} /></td></tr>
            ) : jobs.length === 0 ? (
              <tr><td colSpan="5"><EmptyState compact title="No job postings yet" text="Add your first role to start the public careers page." /></td></tr>
            ) : (
              jobs.map((j) => (
                <tr key={j._id}>
                  <td><strong>{j.pageName || j.title}</strong></td>
                  <td>{j.department || '-'}</td>
                  <td><code style={{ fontSize: '12px' }}>{j.slug || '-'}</code></td>
                  <td><span className={`admin-badge ${j.status === 'published' ? 'green' : 'grey'}`}>{j.status}</span></td>
                  <td>
                    <div className="actions">
                      <button type="button" className="admin-icon-btn act-view" onClick={() => setViewId(j._id)}>View</button>
                      {hasPermission('careers.update') && (
                        <>
                          <button type="button" className="admin-icon-btn act-publish" onClick={() => handlePublish(j)}>
                            {j.status === 'published' ? 'Unpublish' : 'Publish'}
                          </button>
                          <Link to={`/admin/careers/${j._id}/edit`} className="admin-icon-btn act-edit">Edit</Link>
                        </>
                      )}
                      {hasPermission('careers.delete') && (
                        <button type="button" className="admin-icon-btn danger" onClick={() => handleDelete(j)}>Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <DetailModal show={!!viewId} onHide={() => setViewId(null)} title="Job posting details" subtitle={view?.pageName || view?.title}>
        {view && <RecordView record={view} labels={VIEW_LABELS} />}
      </DetailModal>
    </PermissionGuard>
  );
}