import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LearningForm from '../components/forms/LearningForm.jsx';
import { learningApi } from '../../api/learningApi.js';
import PermissionGuard from '../components/PermissionGuard.jsx';
import { ShimmerPanel } from '../../components/ui/States';

export default function LearningEdit() {
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
    learningApi.get(id).then((res) => setInitial(res.data.program)).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleSubmit = async (data) => {
    setSubmitting(true); setError('');
    try {
      if (isEdit) await learningApi.update(id, data);
      else await learningApi.create(data);
      setSuccess('Program saved successfully ✓');
      setTimeout(() => navigate('/admin/learning'), 1000);
    } catch (err) { setError(err.message); setSubmitting(false); }
  };

  return (
    <PermissionGuard permission={isEdit ? 'learning.update' : 'learning.create'}>
      <div className="admin-section-title">
        <span>{isEdit ? 'Edit Learning Program' : 'Add Learning Program'}</span>
        <button type="button" className="admin-outline-btn" onClick={() => navigate(-1)}>{'<- Back'}</button>
      </div>
      <p className="page-sub">{isEdit ? 'Update program details.' : 'Create a new learning program.'}</p>
      {success && <div className="admin-alert success">{success}</div>}
      {error && <div className="admin-alert error">{error}</div>}
      {loading ? <ShimmerPanel variant="form" header={false} />
        : initial || !isEdit ? <LearningForm initial={initial} onSubmit={handleSubmit} submitting={submitting} />
        : <div className="admin-alert error">Program not found</div>}
    </PermissionGuard>
  );
}
