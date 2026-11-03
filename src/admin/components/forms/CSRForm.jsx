import { useState, useEffect } from 'react';
import ImageInput from './ImageInput.jsx';
import { csrApi } from '../../../api/csrApi.js';
import { CSR_CATEGORIES } from '../../../data/csrCategories.js';

const ADD_NEW = '__add_new__';
const defaults = { year: '24-25', tag: '', title: '', desc: '', partner: '', location: '', beneficiaries: '', image: '', status: 'published' };

export default function CSRForm({ initial, onSubmit, submitting }) {
  const [categories, setCategories] = useState(CSR_CATEGORIES);
  const [newTagMode, setNewTagMode] = useState(false);
  const [form, setForm] = useState(() => (initial ? { ...defaults, ...initial } : { ...defaults }));
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    csrApi.categories({ credentials: 'omit' })
      .then((res) => {
        let cats = res?.data?.data?.categories;
        if (!Array.isArray(cats) || !cats.length) cats = CSR_CATEGORIES;
        const cur = initial?.tag;
        if (cur && !cats.includes(cur)) cats = [...cats, cur];
        setCategories(cats);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, status: 'published' });
  };

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      {submitting && <div className="admin-alert info">Saving...</div>}

      <div className="admin-card">
        <h2>Year &amp; Category</h2>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="csr-year">Year *</label>
            <input id="csr-year" type="text" value={form.year} onChange={(e) => set('year', e.target.value)} placeholder="24-25" required />
          </div>
          <div className="field">
            <label htmlFor="csr-category-tag">Category / Tag</label>
            {newTagMode ? (
              <input
                id="csr-category-tag"
                type="text"
                value={form.tag}
                onChange={(e) => set('tag', e.target.value)}
                placeholder="Enter a new category"
              />
            ) : (
              <select
                id="csr-category-tag"
                value={form.tag}
                onChange={(e) => {
                  if (e.target.value === ADD_NEW) {
                    setNewTagMode(true);
                    set('tag', '');
                  } else {
                    set('tag', e.target.value);
                  }
                }}
              >
                <option value="">Select category...</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value={ADD_NEW}>➕ Add new category...</option>
              </select>
            )}
            {newTagMode && (
              <small className="admin-hint">
                New category will be saved and appear in the dropdown for future projects.{' '}
                <button
                  type="button"
                  className="admin-outline-btn"
                  style={{ display: 'inline', fontSize: '12px', padding: '2px 8px', marginLeft: '6px' }}
                  onClick={() => { setNewTagMode(false); set('tag', ''); }}
                >
                  Cancel
                </button>
              </small>
            )}
          </div>
        </div>
        <h2>Publishing</h2>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="csr-status">Status</label>
            <select id="csr-status" value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="csr-image">Image</label>
            <ImageInput id="csr-image" label="Image" value={form.image} onChange={(v) => set('image', v)} />
          </div>
        </div>
        <h2>About the Project</h2>
        <div className="field">
          <label htmlFor="csr-project-title">Project Title *</label>
          <input id="csr-project-title" type="text" value={form.title} onChange={(e) => set('title', e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="csr-description">Description</label>
          <textarea id="csr-description" rows={3} value={form.desc} onChange={(e) => set('desc', e.target.value)} />
        </div>
        <h2>Partner &amp; Reach</h2>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="csr-partner">Partner</label>
            <input id="csr-partner" type="text" value={form.partner} onChange={(e) => set('partner', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="csr-location">Location</label>
            <input id="csr-location" type="text" value={form.location} onChange={(e) => set('location', e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="csr-beneficiaries">Beneficiaries</label>
          <input id="csr-beneficiaries" type="text" value={form.beneficiaries} onChange={(e) => set('beneficiaries', e.target.value)} placeholder="500+ students" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button type="button" className="admin-btn outline" onClick={() => onSubmit({ ...form, status: 'draft' })} disabled={submitting}>Save Draft</button>
        <button type="submit" className="admin-btn" disabled={submitting}>{submitting ? 'Saving...' : 'Publish'}</button>
      </div>
    </form>
  );
}
