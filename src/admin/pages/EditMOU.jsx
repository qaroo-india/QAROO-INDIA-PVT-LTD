import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MOUForm from '../components/forms/MOUForm.jsx';
import { mouApi } from '../../api/mouApi.js';
import PermissionGuard from '../components/PermissionGuard.jsx';
import { ShimmerPanel } from '../../components/ui/States';

export default function EditMOU() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initial, setInitial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    mouApi
      .get(id)
      .then((res) => setInitial(res.data.mou))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data) => {
    setSubmitting(true);
    setError('');
    try {
      await mouApi.update(id, data);
      setSuccess('MOU saved successfully ✓');
      setTimeout(() => navigate('/admin/mous'), 1000);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <PermissionGuard permission="mou.update">
      <div className="admin-section-title">
        <span>Edit MOU</span>
        <button type="button" className="admin-outline-btn" onClick={() => navigate(-1)}>{'<- Back'}</button>
      </div>
      <p className="page-sub">Update memorandum details and save changes.</p>

      {success && <div className="admin-alert success">{success}</div>}
      {error && <div className="admin-alert error">{error}</div>}
      {loading ? (
        <ShimmerPanel variant="form" header={false} />
      ) : initial ? (
        <MOUForm key={initial._id} initial={initial} onSubmit={handleSubmit} submitting={submitting} />
      ) : (
        !error && <div className="admin-alert error">MOU not found</div>
      )}
    </PermissionGuard>
  );
}
