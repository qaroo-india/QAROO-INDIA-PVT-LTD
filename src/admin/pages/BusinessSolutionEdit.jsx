import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BusinessSolutionForm from '../components/forms/BusinessSolutionForm.jsx';
import { businessSolutionApi } from '../../api/businessSolutionApi.js';
import PermissionGuard from '../components/PermissionGuard.jsx';
import { ShimmerPanel } from '../../components/ui/States';

export default function BusinessSolutionEdit() {
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
    businessSolutionApi.get(id).then((res) => setInitial(res.data.solution)).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleSubmit = async (data) => {
    setSubmitting(true); setError('');
    try {
      if (isEdit) await businessSolutionApi.update(id, data);
      else await businessSolutionApi.create(data);
      setSuccess('Business solution saved successfully ✓');
      setTimeout(() => navigate('/admin/business-solutions'), 1000);
    } catch (err) { setError(err.message); setSubmitting(false); }
  };

  return (
    <PermissionGuard permission={isEdit ? 'business.update' : 'business.create'}>
      <div className="admin-section-title">
        <span>{isEdit ? 'Edit Business Solution' : 'Add Business Solution'}</span>
        <button type="button" className="admin-outline-btn" onClick={() => navigate(-1)}>{'<- Back'}</button>
      </div>
      <p className="page-sub">{isEdit ? 'Update solution details.' : 'Create a new business solution.'}</p>
      {success && <div className="admin-alert success">{success}</div>}
      {error && <div className="admin-alert error">{error}</div>}
      {loading ? <ShimmerPanel variant="form" header={false} />
        : initial || !isEdit ? <BusinessSolutionForm initial={initial} onSubmit={handleSubmit} submitting={submitting} />
        : <div className="admin-alert error">Business solution not found</div>}
    </PermissionGuard>
  );
}
