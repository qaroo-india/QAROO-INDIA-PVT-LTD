import { useState, useEffect } from 'react';
import ImageInput from './ImageInput.jsx';
import { mouApi } from '../../../api/mouApi.js';
import { MOU_CATEGORIES } from '../../../data/mouCategories.js';

const ADD_NEW = '__add_new__';
const emptySection = () => ({ heading: '', paragraphs: [], list: [], pathway: [], note: '' });

export default function MOUForm({ initial, onSubmit, submitting }) {
  const [categories, setCategories] = useState(MOU_CATEGORIES);
  const [newTagMode, setNewTagMode] = useState(false);

  useEffect(() => {
    mouApi.categories({ credentials: 'omit' })
      .then((res) => {
        let cats = res?.data?.data?.categories;
        if (!Array.isArray(cats) || !cats.length) cats = MOU_CATEGORIES;
        const cur = initial?.tag;
        if (cur && !cats.includes(cur)) cats = [...cats, cur];
        setCategories(cats);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [form, setForm] = useState(() => {
    if (initial) {
      return {
        tag: initial.tag || '',
        name: initial.name || '',
        blurb: initial.blurb || '',
        logo: initial.logo || '',
        images: initial.images?.length ? initial.images : [''],
        sections: initial.sections?.length ? initial.sections.map((s) => ({ ...s })) : [emptySection()],
        status: initial.status || 'draft',
      };
    }
    return { tag: '', name: '', blurb: '', logo: '', images: [''], sections: [emptySection()], status: 'published' };
  });

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const setImage = (i, val) => {
    const images = [...form.images];
    images[i] = val;
    set('images', images);
  };
  const addImage = () => set('images', [...form.images, '']);
  const removeImage = (i) => set('images', form.images.filter((_, idx) => idx !== i));

  const setSection = (si, field, value) => {
    const sections = [...form.sections];
    sections[si] = { ...sections[si], [field]: value };
    set('sections', sections);
  };
  const addSection = () => set('sections', [...form.sections, emptySection()]);
  const removeSection = (si) => set('sections', form.sections.filter((_, idx) => idx !== si));

  const addListItem = (si) => setSection(si, 'list', [...form.sections[si].list, '']);
  const setListItem = (si, li, val) => {
    const list = [...form.sections[si].list];
    list[li] = val;
    setSection(si, 'list', list);
  };
  const removeListItem = (si, li) =>
    setSection(si, 'list', form.sections[si].list.filter((_, idx) => idx !== li));

  const addPathway = (si) => setSection(si, 'pathway', [...form.sections[si].pathway, '']);
  const setPathway = (si, pi, val) => {
    const pw = [...form.sections[si].pathway];
    pw[pi] = val;
    setSection(si, 'pathway', pw);
  };
  const removePathway = (si, pi) =>
    setSection(si, 'pathway', form.sections[si].pathway.filter((_, idx) => idx !== pi));

  const addParagraph = (si) => setSection(si, 'paragraphs', [...form.sections[si].paragraphs, '']);
  const setParagraph = (si, pi, val) => {
    const p = [...form.sections[si].paragraphs];
    p[pi] = val;
    setSection(si, 'paragraphs', p);
  };
  const removeParagraph = (si, pi) =>
    setSection(si, 'paragraphs', form.sections[si].paragraphs.filter((_, idx) => idx !== pi));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      tag: form.tag.trim(),
      name: form.name.trim(),
      blurb: form.blurb.trim(),
      logo: form.logo || '',
      images: form.images.filter((i) => i && i.trim() !== ''),
      sections: form.sections.filter((s) => s.heading.trim() !== '').map((s) => ({
        heading: s.heading.trim(),
        paragraphs: s.paragraphs.filter((p) => p.trim() !== ''),
        list: s.list.filter((x) => x.trim() !== ''),
        pathway: s.pathway.filter((x) => x.trim() !== ''),
        note: s.note.trim(),
      })),
      status: 'published',
    });
  };

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      {submitting && <div className="admin-alert info">Saving...</div>}

      <div className="admin-card">
        <h2>Category &amp; Status</h2>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="mou-mou-category-tag">MOU Category / Tag</label>
            {newTagMode ? (
              <input
                id="mou-mou-category-tag"
                type="text"
                value={form.tag}
                onChange={(e) => set('tag', e.target.value)}
                placeholder="Enter a new category"
              />
            ) : (
              <select
                id="mou-mou-category-tag"
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
                New category will be saved and appear in the dropdown for future MOUs.{' '}
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
          <div className="field">
            <label htmlFor="mou-status">Status</label>
            <select id="mou-status" value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>
        <h2>Partner</h2>
        <div className="field">
          <label htmlFor="mou-mou-name">MOU Name *</label>
          <input id="mou-mou-name" type="text" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Partner Organization Name" required />
        </div>
        <div className="field">
          <label htmlFor="mou-short-description">Short Description</label>
          <textarea id="mou-short-description" rows={2} value={form.blurb} onChange={(e) => set('blurb', e.target.value)} placeholder="One-line summary shown on the card" />
        </div>
        <div className="field">
          <label htmlFor="mou-logo">Logo</label>
          <ImageInput id="mou-logo" label="Logo" value={form.logo} onChange={(v) => set('logo', v)} />
          <small className="admin-hint">Shown on the MOU card. Upload a file or paste a URL/path (e.g. /logos/your-logo.png).</small>
        </div>
      </div>

      <div className="admin-card">
        <h2>Images</h2>
        {form.images.map((img, i) => (
          <div key={i} className="field" style={{ marginBottom: '16px' }}>
            <ImageInput
              value={img}
              onChange={(v) => setImage(i, v)}
              allowUrl={false}
            />
            <button type="button" className="admin-icon-btn danger" onClick={() => removeImage(i)} style={{ marginTop: '8px' }}>Remove this image</button>
          </div>
        ))}
        <button type="button" className="admin-add-btn" onClick={addImage}>+ Add Image</button>
      </div>

      {form.sections.map((section, si) => (
        <div className="admin-card" key={si}>
          <div className="admin-section-title" style={{ marginBottom: '14px' }}>
            <span>Section {si + 1}</span>
            <button type="button" className="admin-remove-btn" onClick={() => removeSection(si)}>Remove Section</button>
          </div>

          <div className="field">
            <label htmlFor="mou-heading">Heading</label>
            <input id="mou-heading" type="text" value={section.heading} onChange={(e) => setSection(si, 'heading', e.target.value)} placeholder="What Is It?" />
          </div>

          <div className="field">
            <label htmlFor="mou-paragraphs">Paragraphs</label>
            {section.paragraphs.map((p, pi) => (
              <div key={pi} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <textarea id="mou-paragraphs" rows={2} value={p} onChange={(e) => setParagraph(si, pi, e.target.value)} />
                <button type="button" className="admin-icon-btn danger" onClick={() => removeParagraph(si, pi)}>×</button>
              </div>
            ))}
            <button type="button" className="admin-add-btn" onClick={() => addParagraph(si)}>+ Add Paragraph</button>
          </div>

          <div className="field">
            <label htmlFor="mou-list-items">List Items</label>
            {section.list.map((li, liIdx) => (
              <div key={liIdx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input id="mou-list-items" type="text" value={li} onChange={(e) => setListItem(si, liIdx, e.target.value)} />
                <button type="button" className="admin-icon-btn danger" onClick={() => removeListItem(si, liIdx)}>×</button>
              </div>
            ))}
            <button type="button" className="admin-add-btn" onClick={() => addListItem(si)}>+ Add List Item</button>
          </div>

          <div className="field">
            <label htmlFor="mou-pathway">{'Pathway (e.g. College -> Training -> Employment)'}</label>
            {section.pathway.map((pw, pi) => (
              <div key={pi} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input id="mou-pathway" type="text" value={pw} onChange={(e) => setPathway(si, pi, e.target.value)} placeholder="Step" />
                <button type="button" className="admin-icon-btn danger" onClick={() => removePathway(si, pi)}>×</button>
              </div>
            ))}
            <button type="button" className="admin-add-btn" onClick={() => addPathway(si)}>+ Add Pathway Step</button>
          </div>

          <div className="field">
            <label htmlFor="mou-note">Note</label>
            <textarea id="mou-note" rows={2} value={section.note} onChange={(e) => setSection(si, 'note', e.target.value)} placeholder="Warning / caution note" />
          </div>
        </div>
      ))}

      <button type="button" className="admin-add-btn" onClick={addSection} style={{ marginBottom: '20px' }}>+ Add Section</button>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          type="button"
          className="admin-btn outline"
          onClick={() => onSubmit({ ...form, status: 'draft' })}
          disabled={submitting}
        >
          Save Draft
        </button>
        <button type="submit" className="admin-btn" disabled={submitting}>
          {submitting ? 'Saving...' : 'Publish'}
        </button>
      </div>
    </form>
  );
}
