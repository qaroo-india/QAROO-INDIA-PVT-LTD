import { useState } from 'react';
import ImageInput from './ImageInput.jsx';
import { StringListEditor, ModuleListEditor, FaqListEditor, SeoFields } from './ContentFields.jsx';
import { slugify } from '../../../utils/slug.js';

const defaults = {
  title: '', slug: '', desc: '', shortDescription: '', fullDescription: '',
  skills: [''], category: '', image: '', status: 'published', displayOrder: 0,
  highlights: [''], learn: [''], tools: [''], modules: [{ title: '', items: [''] }],
  careers: [''], audience: [''], benefits: [''], certification: '', placement: '',
  modes: [''], faq: [{ q: '', a: '' }], cta: '',
  keyword: '', seoTitle: '', seoDescription: '', seoKeywords: [], ogTitle: '',
  ogDescription: '', ogImage: '', canonicalUrl: '',
};

const norm = (v) => (Array.isArray(v) && v.length ? v : ['']);
const normMod = (v) => (Array.isArray(v) && v.length ? v : [{ title: '', items: [''] }]);
const normFaq = (v) => (Array.isArray(v) && v.length ? v : [{ q: '', a: '' }]);

export default function LearningForm({ initial, onSubmit, submitting }) {
  const [form, setForm] = useState(() => {
    if (!initial) return { ...defaults, modules: [{ title: '', items: [''] }], faq: [{ q: '', a: '' }] };
    return {
      ...defaults, ...initial,
      skills: norm(initial.skills), highlights: norm(initial.highlights), learn: norm(initial.learn),
      tools: norm(initial.tools), modules: normMod(initial.modules), careers: norm(initial.careers),
      audience: norm(initial.audience), benefits: norm(initial.benefits), modes: norm(initial.modes),
      faq: normFaq(initial.faq), seoKeywords: initial.seoKeywords || [],
    };
  });
  // Whether the slug was auto-generated from the title or manually provided.
  const [slugAuto, setSlugAuto] = useState(() => !initial || !initial.slug);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const get = (k) => form[k];

  const onTitle = (v) => {
    if (slugAuto) set('slug', slugify(v));
    set('title', v);
  };
  const onSlug = (v) => {
    setSlugAuto(false);
    set('slug', v);
  };

  const cleanup = (f) => ({
    ...f,
    skills: f.skills.filter((s) => s.trim()),
    highlights: f.highlights.filter((s) => s.trim()),
    learn: f.learn.filter((s) => s.trim()),
    tools: f.tools.filter((s) => s.trim()),
    careers: f.careers.filter((s) => s.trim()),
    audience: f.audience.filter((s) => s.trim()),
    benefits: f.benefits.filter((s) => s.trim()),
    modes: f.modes.filter((s) => s.trim()),
    modules: f.modules.map((m) => ({ title: m.title, items: (m.items || []).filter((x) => x.trim()) })).filter((m) => m.title.trim()),
    faq: f.faq.map((x) => ({ q: x.q, a: x.a })).filter((x) => x.q.trim()),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...cleanup(form), status: 'published' });
  };

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      {submitting && <div className="admin-alert info">Saving...</div>}

      <div className="admin-card">
        <h2>Basic Information</h2>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="learning-status">Status</label>
            <select id="learning-status" value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="learning-display-order">Display Order</label>
            <input id="learning-display-order" type="number" value={form.displayOrder} onChange={(e) => set('displayOrder', Number(e.target.value))} placeholder="1" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="learning-program-title">Program Title *</label>
          <input id="learning-program-title" type="text" value={form.title} onChange={(e) => onTitle(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="learning-slug">Slug (auto-generated from title; leave empty to auto-generate)</label>
          <input id="learning-slug" type="text" value={form.slug} onChange={(e) => onSlug(e.target.value)} placeholder="cloud-computing" />
          <p className="hint">Public URL: /learning-programs/{form.slug || '<slug>'}</p>
        </div>
        <div className="field">
          <label htmlFor="learning-short-description">Short Description</label>
          <textarea id="learning-short-description" rows={2} value={form.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="learning-full-description">Full Description</label>
          <textarea id="learning-full-description" rows={4} value={form.fullDescription} onChange={(e) => set('fullDescription', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="learning-program-image">Program Image</label>
          <ImageInput id="learning-program-image" label="Program Image" value={form.image} onChange={(v) => set('image', v)} />
        </div>
        <div className="field">
          <label htmlFor="learning-cta-text">CTA Text</label>
          <input id="learning-cta-text" type="text" value={form.cta} onChange={(e) => set('cta', e.target.value)} />
        </div>
      </div>

      <div className="admin-card">
        <h2>Course Content</h2>
        <StringListEditor label="Key Highlights" value={form.highlights} onChange={(v) => set('highlights', v)} />
        <StringListEditor label="What You Will Learn" value={form.learn} onChange={(v) => set('learn', v)} hint="Each entry above is kept even if left blank during entry." />
        <StringListEditor label="Tools & Technologies" value={form.tools} onChange={(v) => set('tools', v)} />
        <ModuleListEditor label="Course Modules" value={form.modules} onChange={(v) => set('modules', v)} itemPlaceholder="Module item" />
        <StringListEditor label="Career Opportunities" value={form.careers} onChange={(v) => set('careers', v)} />
        <StringListEditor label="Who Can Join" value={form.audience} onChange={(v) => set('audience', v)} />
        <StringListEditor label="Course Benefits" value={form.benefits} onChange={(v) => set('benefits', v)} />
        <div className="form-grid">
          <div className="field">
            <label htmlFor="learning-certification">Certification</label>
            <textarea id="learning-certification" rows={2} value={form.certification} onChange={(e) => set('certification', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="learning-placement-support">Placement Support</label>
            <textarea id="learning-placement-support" rows={2} value={form.placement} onChange={(e) => set('placement', e.target.value)} />
          </div>
        </div>
        <StringListEditor label="Learning Modes" value={form.modes} onChange={(v) => set('modes', v)} />
      </div>

      <div className="admin-card">
        <h2>FAQ</h2>
        <FaqListEditor value={form.faq} onChange={(v) => set('faq', v)} />
      </div>

      <div className="admin-card">
        <h2>SEO</h2>
        <SeoFields get={get} set={set} />
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button type="button" className="admin-btn outline" onClick={() => onSubmit({ ...cleanup(form), status: 'draft' })} disabled={submitting}>Save Draft</button>
        <button type="submit" className="admin-btn" disabled={submitting}>{submitting ? 'Saving...' : 'Publish'}</button>
      </div>
    </form>
  );
}
