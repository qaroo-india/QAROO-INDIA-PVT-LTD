import { useState } from 'react';
import ImageInput from './ImageInput.jsx';
import { StringListEditor, ModuleListEditor, FaqListEditor, SeoFields } from './ContentFields.jsx';
import { slugify } from '../../../utils/slug.js';

const defaults = {
  title: '', pageName: '', slug: '', image: '', status: 'published', displayOrder: 0,
  shortDescription: '', fullDescription: '', cta: '',
  services: [''], features: [''], benefits: [''], useCases: [''],
  audience: [''], problems: [''], solutions: [''], techniques: [''],
  process: [{ title: '', items: [''] }], industries: [''], whyChoose: [''],
  faq: [{ q: '', a: '' }],
  keyword: '', seoTitle: '', seoDescription: '', seoKeywords: [], ogTitle: '',
  ogDescription: '', ogImage: '', canonicalUrl: '',
};

const norm = (v) => (Array.isArray(v) && v.length ? v : ['']);
const normProc = (v) => (Array.isArray(v) && v.length ? v : [{ title: '', items: [''] }]);
const normFaq = (v) => (Array.isArray(v) && v.length ? v : [{ q: '', a: '' }]);

export default function BusinessSolutionForm({ initial, onSubmit, submitting }) {
  const [form, setForm] = useState(() => {
    if (!initial) return { ...defaults, process: [{ title: '', items: [''] }], faq: [{ q: '', a: '' }] };
    return {
      ...defaults, ...initial,
      title: initial.title || initial.pageName || '',
      pageName: initial.pageName || initial.title || '',
      services: norm(initial.services), features: norm(initial.features),
      benefits: norm(initial.benefits), useCases: norm(initial.useCases),
      audience: norm(initial.audience), problems: norm(initial.problems),
      solutions: norm(initial.solutions), techniques: norm(initial.techniques),
      process: normProc(initial.process), industries: norm(initial.industries),
      whyChoose: norm(initial.whyChoose), faq: normFaq(initial.faq),
      seoKeywords: initial.seoKeywords || [],
    };
  });
  const [slugAuto, setSlugAuto] = useState(() => !initial || !initial.slug);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onTitle = (v) => {
    if (slugAuto) set('slug', slugify(v));
    set('title', v);
    set('pageName', v);
  };
  const onSlug = (v) => { setSlugAuto(false); set('slug', v); };

  const cleanup = (f) => ({
    ...f,
    title: f.title || f.pageName,
    pageName: f.pageName || f.title,
    services: f.services.filter((s) => s.trim()),
    features: f.features.filter((s) => s.trim()),
    benefits: f.benefits.filter((s) => s.trim()),
    useCases: f.useCases.filter((s) => s.trim()),
    audience: f.audience.filter((s) => s.trim()),
    problems: f.problems.filter((s) => s.trim()),
    solutions: f.solutions.filter((s) => s.trim()),
    techniques: f.techniques.filter((s) => s.trim()),
    industries: f.industries.filter((s) => s.trim()),
    whyChoose: f.whyChoose.filter((s) => s.trim()),
    process: f.process.map((m) => ({ title: m.title, items: (m.items || []).filter((x) => x.trim()) })).filter((m) => m.title.trim()),
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
            <label htmlFor="solution-status">Status</label>
            <select id="solution-status" value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="solution-display-order">Display Order</label>
            <input id="solution-display-order" type="number" value={form.displayOrder} onChange={(e) => set('displayOrder', Number(e.target.value))} placeholder="1" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="solution-solution-title">Solution Title *</label>
          <input id="solution-solution-title" type="text" value={form.title} onChange={(e) => onTitle(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="solution-slug">Slug (auto-generated from title; leave empty to auto-generate)</label>
          <input id="solution-slug" type="text" value={form.slug} onChange={(e) => onSlug(e.target.value)} placeholder="crm-solutions" />
          <p className="hint">Public URL: /business-solutions/{form.slug || '<slug>'}</p>
        </div>
        <div className="field">
          <label htmlFor="solution-short-description">Short Description</label>
          <textarea id="solution-short-description" rows={2} value={form.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="solution-full-description">Full Description</label>
          <textarea id="solution-full-description" rows={4} value={form.fullDescription} onChange={(e) => set('fullDescription', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="solution-solution-image">Solution Image</label>
          <ImageInput id="solution-solution-image" label="Solution Image" value={form.image} onChange={(v) => set('image', v)} />
        </div>
        <div className="field">
          <label htmlFor="solution-cta-text">CTA Text</label>
          <input id="solution-cta-text" type="text" value={form.cta} onChange={(e) => set('cta', e.target.value)} />
        </div>
      </div>

      <div className="admin-card">
        <h2>Solution Content</h2>
        <StringListEditor label="Services" value={form.services} onChange={(v) => set('services', v)} />
        <StringListEditor label="Features" value={form.features} onChange={(v) => set('features', v)} />
        <StringListEditor label="Benefits" value={form.benefits} onChange={(v) => set('benefits', v)} />
        <StringListEditor label="Use Cases" value={form.useCases} onChange={(v) => set('useCases', v)} />
        <StringListEditor label="Who This Is For" value={form.audience} onChange={(v) => set('audience', v)} />
        <StringListEditor label="Problems We Solve" value={form.problems} onChange={(v) => set('problems', v)} />
        <StringListEditor label="Our Solutions" value={form.solutions} onChange={(v) => set('solutions', v)} />
        <StringListEditor label="Techniques / Approach" value={form.techniques} onChange={(v) => set('techniques', v)} />
        <ModuleListEditor label="Process Steps" value={form.process} onChange={(v) => set('process', v)} itemPlaceholder="Step detail" />
        <StringListEditor label="Industries" value={form.industries} onChange={(v) => set('industries', v)} />
        <StringListEditor label="Why Choose Us" value={form.whyChoose} onChange={(v) => set('whyChoose', v)} />
      </div>

      <div className="admin-card">
        <h2>FAQ</h2>
        <FaqListEditor value={form.faq} onChange={(v) => set('faq', v)} />
      </div>

      <div className="admin-card">
        <h2>SEO</h2>
        <SeoFields get={(k) => form[k]} set={set} />
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button type="button" className="admin-btn outline" onClick={() => onSubmit({ ...cleanup(form), status: 'draft' })} disabled={submitting}>Save Draft</button>
        <button type="submit" className="admin-btn" disabled={submitting}>{submitting ? 'Saving...' : 'Publish'}</button>
      </div>
    </form>
  );
}
