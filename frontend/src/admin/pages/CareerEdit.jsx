import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CareerForm from '../components/forms/CareerForm.jsx';
import { careerApi } from '../../api/careerApi.js';
import PermissionGuard from '../components/PermissionGuard.jsx';
import { ShimmerPanel } from '../../components/ui/States';

export default function CareerEdit() {
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
    careerApi
      .get(id)
      .then((res) => setInitial(res.data.job))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleSubmit = async (data) => {
    setSubmitting(true);
    setError('');
    try {
      if (isEdit) await careerApi.update(id, data);
      else await careerApi.create(data);
      setSuccess('Job posting saved successfully ✓');
      setTimeout(() => navigate('/admin/careers'), 1000);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <PermissionGuard permission={isEdit ? 'careers.update' : 'careers.create'}>
      <div className="admin-section-title">
        <span>{isEdit ? 'Edit Job Posting' : 'Add Job Posting'}</span>
        <button type="button" className="admin-outline-btn" onClick={() => navigate(-1)}>{'<- Back'}</button>
      </div>
      <p className="page-sub">
        {isEdit ? 'Update this role. Unpublish it to take it off the site without deleting it.' : 'Create a new role. Save as draft to keep it off the site until it is ready.'}
      </p>
      {success && <div className="admin-alert success">{success}</div>}
      {error && <div className="admin-alert error">{error}</div>}
      {loading ? (
        <ShimmerPanel variant="form" header={false} />
      ) : initial || !isEdit ? (
        <CareerForm initial={initial} onSubmit={handleSubmit} submitting={submitting} />
      ) : (
        <div className="admin-alert error">Job posting not found</div>
      )}
    </PermissionGuard>
  );
}
