import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MOUForm from '../components/forms/MOUForm.jsx';
import { mouApi } from '../../api/mouApi.js';
import PermissionGuard from '../components/PermissionGuard.jsx';

export default function CreateMOU() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (data) => {
    setSubmitting(true);
    setError('');
    try {
      await mouApi.create(data);
      setSuccess('MOU saved successfully ✓');
      setTimeout(() => navigate('/admin/mous'), 1000);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <PermissionGuard permission="mou.create">
      <div className="admin-section-title">
        <span>Add MOU</span>
        <button type="button" className="admin-outline-btn" onClick={() => navigate(-1)}>{'<- Back'}</button>
      </div>
      <p className="page-sub">Create a new memorandum of understanding.</p>

      {success && <div className="admin-alert success">{success}</div>}
      {error && <div className="admin-alert error">{error}</div>}

      <MOUForm onSubmit={handleSubmit} submitting={submitting} />
    </PermissionGuard>
  );
}
