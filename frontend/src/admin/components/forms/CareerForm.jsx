import { useState } from 'react';
import { StringListEditor, ModuleListEditor, SeoFields } from './ContentFields.jsx';
import { slugify } from '../../../utils/slug.js';

const EMPLOYMENT_TYPES = [
  ['FULL_TIME', 'Full time'],
  ['PART_TIME', 'Part time'],
  ['INTERN', 'Internship'],
  ['CONTRACTOR', 'Contract'],
  ['TEMPORARY', 'Temporary'],
  ['OTHER', 'Other'],
];

const defaults = {
  title: '', pageName: '', slug: '', status: 'draft', displayOrder: 0,
  jobType: '', experience: '', department: '', location: 'Coimbatore',
  employmentType: 'FULL_TIME', overview: '', note: '',
  responsibilities: [''], techStack: [{ title: '', items: [''] }],
  requiredSkills: [''], preferredSkills: [''], qualifications: [''],
  trainingAreas: [''], idealCandidate: [''], benefits: [''], knowledgeAreas: [''],
  keyword: '', seoTitle: '', seoDescription: '', seoKeywords: [], ogTitle: '',
  ogDescription: '', ogImage: '', canonicalUrl: '',
};

const norm = (v) => (Array.isArray(v) && v.length ? v : ['']);
const normStack = (v) => (Array.isArray(v) && v.length ? v : [{ title: '', items: [''] }]);

const cleanup = (f) => {
  const arr = (v) => (Array.isArray(v) ? v.filter((x) => String(x).trim() !== '') : []);
  return {
    ...f,
    responsibilities: arr(f.responsibilities),
    requiredSkills: arr(f.requiredSkills),
    preferredSkills: arr(f.preferredSkills),
    qualifications: arr(f.qualifications),
    trainingAreas: arr(f.trainingAreas),
    idealCandidate: arr(f.idealCandidate),
    benefits: arr(f.benefits),
    knowledgeAreas: arr(f.knowledgeAreas),
    techStack: (Array.isArray(f.techStack) ? f.techStack : [])
      .map((g) => ({ ...g, items: arr(g.items) }))
      .filter((g) => String(g.title || '').trim() !== ''),
    seoKeywords: arr(f.seoKeywords),
    displayOrder: Number(f.displayOrder) || 0,
  };
};

/**
 * Job posting form. Every description block is optional - a role renders only
 * what it fills, so one form covers software roles, trainee roles, internships
 * and finance roles without conditional sections.
 */
export default function CareerForm({ initial, onSubmit, submitting }) {
  const [form, setForm] = useState(() => {
    if (!initial) return { ...defaults };
    return {
      ...defaults,
      ...initial,
      title: initial.title || initial.pageName || '',
      pageName: initial.pageName || initial.title || '',
      responsibilities: norm(initial.responsibilities),
      requiredSkills: norm(initial.requiredSkills),
      preferredSkills: norm(initial.preferredSkills),
      qualifications: norm(initial.qualifications),
      trainingAreas: norm(initial.trainingAreas),
      idealCandidate: norm(initial.idealCandidate),
      benefits: norm(initial.benefits),
      knowledgeAreas: norm(initial.knowledgeAreas),
      techStack: normStack(initial.techStack),
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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...cleanup(form), status: 'published' });
  };

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <div className="admin-card">
        <h2>Role</h2>
        <div className="field">
          <label htmlFor="job-title">Job Title *</label>
          <input
            id="job-title"
            type="text"
            value={form.title}
            onChange={(e) => onTitle(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="job-slug">URL Slug</label>
          <input
            id="job-slug"
            type="text"
            value={form.slug}
            onChange={(e) => {
              setSlugAuto(false);
              set('slug', e.target.value);
            }}
          />
          <small className="admin-hint">
            The page lives at /careers/{form.slug || 'your-slug'} - leave it alone to follow the title.
          </small>
        </div>
        <div className="field">
          <label htmlFor="job-department">Department</label>
          <input
            id="job-department"
            type="text"
            value={form.department}
            onChange={(e) => set('department', e.target.value)}
            placeholder="Software Development"
          />
          <small className="admin-hint">Groups the role in the filter on the careers page.</small>
        </div>
        <div className="field">
          <label htmlFor="job-type">Job Type</label>
          <input
            id="job-type"
            type="text"
            value={form.jobType}
            onChange={(e) => set('jobType', e.target.value)}
            placeholder="Full-Time | Entry Level"
          />
        </div>
        <div className="field">
          <label htmlFor="job-experience">Experience</label>
          <input
            id="job-experience"
            type="text"
            value={form.experience}
            onChange={(e) => set('experience', e.target.value)}
            placeholder="0-1 Year / Freshers"
          />
        </div>
        <div className="field">
          <label htmlFor="job-location">Location</label>
          <input
            id="job-location"
            type="text"
            value={form.location}
            onChange={(e) => set('location', e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="job-employment">Employment Type</label>
          <select
            id="job-employment"
            value={form.employmentType}
            onChange={(e) => set('employmentType', e.target.value)}
          >
            {EMPLOYMENT_TYPES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <small className="admin-hint">
            Used by the JobPosting structured data Google reads - keep it accurate.
          </small>
        </div>
        <div className="field">
          <label htmlFor="job-order">Display Order</label>
          <input
            id="job-order"
            type="number"
            value={form.displayOrder}
            onChange={(e) => set('displayOrder', e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="job-overview">Job Overview</label>
          <textarea
            id="job-overview"
            rows={6}
            value={form.overview}
            onChange={(e) => set('overview', e.target.value)}
          />
          <small className="admin-hint">Leave a blank line between paragraphs.</small>
        </div>
      </div>

      <div className="admin-card">
        <h2>Job Description</h2>
        <small className="admin-hint">
          Leave any block empty and it simply will not appear on the page.
        </small>
        <StringListEditor
          label="Key Responsibilities"
          value={form.responsibilities}
          onChange={(v) => set('responsibilities', v)}
        />
        <StringListEditor
          label="Training Areas"
          value={form.trainingAreas}
          onChange={(v) => set('trainingAreas', v)}
        />
        <ModuleListEditor
          label="Technical Stack"
          value={form.techStack}
          onChange={(v) => set('techStack', v)}
          itemPlaceholder="Technology"
        />
        <div className="field">
          <label htmlFor="job-note">Stack Note</label>
          <input
            id="job-note"
            type="text"
            value={form.note}
            onChange={(e) => set('note', e.target.value)}
            placeholder="The actual technology stack may vary depending on the assigned project."
          />
        </div>
        <StringListEditor
          label="Required Skills"
          value={form.requiredSkills}
          onChange={(v) => set('requiredSkills', v)}
        />
        <StringListEditor
          label="Preferred Skills"
          value={form.preferredSkills}
          onChange={(v) => set('preferredSkills', v)}
        />
        <StringListEditor
          label="Knowledge Areas"
          value={form.knowledgeAreas}
          onChange={(v) => set('knowledgeAreas', v)}
          hint="Shown as 'Accounting Knowledge' on the role page."
        />
        <StringListEditor
          label="Qualification"
          value={form.qualifications}
          onChange={(v) => set('qualifications', v)}
        />
        <StringListEditor
          label="Ideal Candidate"
          value={form.idealCandidate}
          onChange={(v) => set('idealCandidate', v)}
        />
        <StringListEditor
          label="Benefits"
          value={form.benefits}
          onChange={(v) => set('benefits', v)}
        />
      </div>

      <div className="admin-card">
        <h2>SEO</h2>
        <SeoFields get={(k) => form[k]} set={set} />
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          type="button"
          className="admin-btn outline"
          onClick={() => onSubmit({ ...cleanup(form), status: 'draft' })}
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
