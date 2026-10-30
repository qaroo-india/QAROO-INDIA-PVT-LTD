import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CSRForm from '../components/forms/CSRForm.jsx';
import { csrApi } from '../../api/csrApi.js';
import PermissionGuard from '../components/PermissionGuard.jsx';
import { ShimmerPanel } from '../../components/ui/States';

export default function CSREdit() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [initial, setInitial] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    csrApi.get(id).then((res) => setInitial(res.data.project)).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleSubmit = async (data) => {
    setSubmitting(true); setError('');
    try {
      if (isEdit) await csrApi.update(id, data);
      else await csrApi.create(data);
      setSuccess('Project saved successfully ✓');
      setTimeout(() => navigate('/admin/csr'), 1000);
    } catch (err) { setError(err.message); setSubmitting(false); }
  };

  const permission = isEdit ? 'csr.update' : 'csr.create';

  return (
    <PermissionGuard permission={permission}>
      <div className="admin-section-title">
        <span>{isEdit ? 'Edit CSR Project' : 'Add CSR Project'}</span>
        <button type="button" className="admin-outline-btn" onClick={() => navigate(-1)}>{'<- Back'}</button>
      </div>
      <p className="page-sub">{isEdit ? 'Update project details.' : 'Create a new CSR project.'}</p>
      {success && <div className="admin-alert success">{success}</div>}
      {error && <div className="admin-alert error">{error}</div>}
      {loading ? <ShimmerPanel variant="form" header={false} />
        : initial || !isEdit ? <CSRForm initial={initial} onSubmit={handleSubmit} submitting={submitting} />
        : !error && <div className="admin-alert error">Project not found</div>}
    </PermissionGuard>
  );
}
