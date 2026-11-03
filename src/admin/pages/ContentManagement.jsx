import { useState, useEffect } from 'react';
import { contentApi } from '../../api/contentApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ShimmerPanel } from '../../components/ui/States';
import { useToast } from '../../context/ToastContext';

const DEFAULT_ABOUT_STATS = [
  { num: '20', label: 'MoUs signed' },
  { num: '9', label: 'Active partners' },
  { num: '2', label: 'Office locations' },
  { num: '1500', label: 'Students impacted' },
];

const DEFAULT_LEARNING_PAGE = {
  eyebrow: 'The Qaroo Launchpad',
  heading: 'Skills that move your career forward.',
  description: 'Practical, project-based training across technology, design and analytics - grouped by career path.',
  stepperHeading: 'From enquiry to certification in 6 steps.',
  stepperDesc: 'Our structured enrollment process ensures you get the right training for your career goals.',
  steps: [
    { title: 'Connect', desc: 'Browse our career tracks and submit an enquiry. Our team will reach out within 24 hours to discuss your background and goals.' },
    { title: 'Evaluate', desc: 'We assess your current skills and learning needs to recommend the right track and pace for your journey.' },
    { title: 'Mentor', desc: 'Speak one-on-one with our career counselor to finalize the best track for your goals, batch timing, duration and fee structure.' },
    { title: 'Lock It In', desc: 'Complete your enrollment with flexible payment options. Get access to pre-reading materials and orientation.' },
    { title: 'Upskill', desc: 'Hands-on projects, live sessions, and mentorship from industry professionals. Build your portfolio as you learn.' },
    { title: 'Ace', desc: 'Complete your capstone project and earn your certification. Our placement support helps you land your next role.' },
  ],
};

const DEFAULT_CSR_PAGE = {
  eyebrow: 'Corporate Social Responsibility',
  title: 'CSR Projects',
  description: 'Programs delivered in partnership with our CSR & academic network, creating real impact across Tamil Nadu.',
  mouBannerTitle: 'Explore our Institutional Partnerships',
  mouBannerDesc: 'View all 20+ Memorandums of Understanding with detailed assessments.',
};

const DEFAULT_MOU_PAGE = {
  eyebrow: 'Institutional Partnerships',
  title: 'MOU Directory',
  description: 'Every memorandum of understanding on record - who the partner is, what it can offer students, and our read on how strong the collaboration actually is.',
};

const PAGE_FALLBACKS = {
  learning: DEFAULT_LEARNING_PAGE,
  csr: DEFAULT_CSR_PAGE,
  mou: DEFAULT_MOU_PAGE,
};

// Schema definitions per page: describes editable fields.
const SCHEMAS = {
  home: {
    title: 'Home',
    fields: [
      { key: 'heroEyebrow', label: 'Hero Eyebrow', type: 'text' },
      { key: 'heroTitle', label: 'Hero Title', type: 'text' },
      { key: 'heroDescription', label: 'Hero Description', type: 'textarea' },
      { key: 'buttons', label: 'Hero Buttons', type: 'rows', subfields: [
        { key: 'text', label: 'Button Text', type: 'text' },
        { key: 'link', label: 'Button Link', type: 'text' },
        { key: 'style', label: 'Style (yellow/white)', type: 'text' },
      ]},
      { key: 'statistics', label: 'Statistics', type: 'rows', subfields: [
        { key: 'num', label: 'Number', type: 'text' },
        { key: 'label', label: 'Label', type: 'text' },
      ]},
    ],
  },
  about: {
    title: 'About',
    fields: [
      { key: 'visionTitle', label: 'Vision Title', type: 'text' },
      { key: 'visionBody', label: 'Vision Body', type: 'textarea' },
      { key: 'missionTitle', label: 'Mission Title', type: 'text' },
      { key: 'pillars', label: 'Mission Pillars', type: 'strings' },
      { key: 'milestones', label: 'Milestones', type: 'rows', subfields: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'desc', label: 'Description', type: 'textarea' },
      ]},
      { key: 'partners', label: 'Prestigious Partners', type: 'rows', subfields: [
        { key: 'name', label: 'Partner Name', type: 'text' },
        { key: 'image', label: 'Logo URL (image link)', type: 'image' },
        { key: 'desc', label: 'Description', type: 'textarea' },
      ]},
      { key: 'stats', label: 'By the Numbers (stats)', type: 'rows', subfields: [
        { key: 'num', label: 'Number', type: 'text' },
        { key: 'label', label: 'Label', type: 'text' },
      ]},
    ],
  },
  business: {
    title: 'Business Solutions',
    fields: [
      { key: 'services', label: 'Services', type: 'rows', subfields: [
        { key: 'idx', label: 'Index', type: 'text' },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'desc', label: 'Description', type: 'textarea' },
      ]},
      { key: 'ctaTitle', label: 'CTA Title', type: 'text' },
      { key: 'links', label: 'Resource & Footer Links', type: 'urls' },
    ],
  },
  learning: {
    title: 'Learning Programs',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'stepperHeading', label: 'Stepper Heading', type: 'text' },
      { key: 'stepperDesc', label: 'Stepper Description', type: 'textarea' },
      { key: 'steps', label: 'Enrollment Steps', type: 'rows', subfields: [
        { key: 'title', label: 'Step Title', type: 'text' },
        { key: 'desc', label: 'Step Description', type: 'textarea' },
      ]},
      { key: 'links', label: 'Resource & Footer Links', type: 'urls' },
    ],
  },
  csr: {
    title: 'CSR Projects',
    fields: [
      { key: 'eyebrow', label: 'Hero Eyebrow', type: 'text' },
      { key: 'title', label: 'Hero Title', type: 'text' },
      { key: 'description', label: 'Hero Description', type: 'textarea' },
      { key: 'mouBannerTitle', label: 'MOU Banner Title', type: 'text' },
      { key: 'mouBannerDesc', label: 'MOU Banner Description', type: 'textarea' },
    ],
  },
  mou: {
    title: 'MOU Directory',
    fields: [
      { key: 'eyebrow', label: 'Hero Eyebrow', type: 'text' },
      { key: 'title', label: 'Hero Title', type: 'text' },
      { key: 'description', label: 'Hero Description', type: 'textarea' },
    ],
  },
  careers: {
    title: 'Careers',
    fields: [
      { key: 'eyebrow', label: 'Hero Eyebrow', type: 'text' },
      { key: 'title', label: 'Hero Title', type: 'text' },
      { key: 'intro', label: 'Hero Intro', type: 'textarea' },
      { key: 'scope', label: 'Where We Hire (heading)', type: 'textarea' },
      { key: 'belief', label: 'Where We Hire (supporting)', type: 'textarea' },
      { key: 'processTitle', label: 'Recruitment Section Title', type: 'text' },
      { key: 'processNote', label: 'Recruitment Note', type: 'textarea' },
      { key: 'lookForTitle', label: 'What We Look For - Title', type: 'text' },
      { key: 'lookForIntro', label: 'What We Look For - Intro', type: 'textarea' },
      { key: 'lookFor', label: 'What We Look For - Items', type: 'rows', subfields: [
        { key: 'title', label: 'Trait', type: 'text' },
        { key: 'desc', label: 'Description', type: 'textarea' },
      ] },
      { key: 'growthTitle', label: 'Career Growth - Title', type: 'text' },
      { key: 'growthIntro', label: 'Career Growth - Intro', type: 'text' },
      { key: 'growth', label: 'Career Growth - Steps', type: 'strings' },
      { key: 'growthNote', label: 'Career Growth - Note', type: 'textarea' },
      { key: 'ctaTitle', label: 'CTA Title', type: 'text' },
      { key: 'ctaBody', label: 'CTA Body', type: 'textarea' },
      { key: 'ctaLabel', label: 'CTA Eyebrow', type: 'text' },
      { key: 'faq', label: 'FAQ / AI Answers', type: 'rows', subfields: [
        { key: 'q', label: 'Question', type: 'text' },
        { key: 'a', label: 'Answer', type: 'textarea' },
      ] },
      { key: 'seoTitle', label: 'SEO Title', type: 'text' },
      { key: 'seoDescription', label: 'SEO Description', type: 'textarea' },
    ],
  },
  contact: {
    title: 'Contact',
    fields: [
      { key: 'offices', label: 'Offices', type: 'rows', subfields: [
        { key: 'title', label: 'Office Name', type: 'text' },
        { key: 'lines', label: 'Address Lines', type: 'strings' },
      ]},
      { key: 'contact', label: 'Contact Info', type: 'object', subfields: [
        { key: 'email', label: 'Email', type: 'text' },
        { key: 'phones', label: 'Phones', type: 'strings' },
      ]},
      { key: 'hours', label: 'Business Hours', type: 'object', subfields: [
        { key: 'days', label: 'Days', type: 'text' },
        { key: 'time', label: 'Time', type: 'text' },
      ]},
    ],
  },
  footer: {
    title: 'Footer',
    fields: [
      { key: 'brandName', label: 'Brand Name', type: 'text' },
      { key: 'tagline', label: 'Tagline / About', type: 'textarea' },
      { key: 'email', label: 'Contact Email', type: 'text' },
      { key: 'phones', label: 'Contact Phones', type: 'strings' },
      { key: 'socials', label: 'Social Media Links', type: 'rows', subfields: [
        { key: 'platform', label: 'Platform (instagram / linkedin / facebook / youtube / email)', type: 'text' },
        { key: 'url', label: 'URL / Email Link', type: 'text' },
      ]},
      { key: 'copyright', label: 'Copyright Text', type: 'text' },
    ],
  },
};

function FieldRenderer({ field, value, onChange }) {
  const set = (k, v) => {
    let next;
    if (field.type === 'object') next = { ...(value || {}), [k]: v };
    else next = v;
    onChange(next);
  };

  const pushStr = (arr, v) => onChange([...(arr || []), v]);
  const setStr = (arr, i, v) => { const a = [...(arr || [])]; a[i] = v; onChange(a); };
  const removeStr = (arr, i) => onChange((arr || []).filter((_, x) => x !== i));

  const pushRow = (arr) => onChange([...(arr || []), {}]);
  const setRow = (arr, i, k, v) => { const a = [...(arr || [])]; a[i] = { ...(a[i] || {}), [k]: v }; onChange(a); };
  const removeRow = (arr, i) => onChange((arr || []).filter((_, x) => x !== i));

  if (field.type === 'text') {
    return <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} style={{ width: '100%' }} />;
  }
  if (field.type === 'textarea') {
    return <textarea rows={3} value={value || ''} onChange={(e) => onChange(e.target.value)} style={{ width: '100%' }} />;
  }
  if (field.type === 'strings') {
    const arr = value || [];
    return (
      <div>
        {(arr || []).map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input type="text" value={s} onChange={(e) => setStr(arr, i, e.target.value)} style={{ flex: 1 }} />
            <button type="button" className="admin-icon-btn danger" onClick={() => removeStr(arr, i)}>×</button>
          </div>
        ))}
        <button type="button" className="admin-add-btn" onClick={() => pushStr(arr, '')}>+ Add Item</button>
      </div>
    );
  }
  if (field.type === 'urls') {
    const arr = value || [];
    return (
      <div>
        {(arr || []).map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input type="url" value={s} onChange={(e) => setStr(arr, i, e.target.value)} style={{ flex: 1 }} placeholder="https://..." />
            <button type="button" className="admin-icon-btn danger" onClick={() => removeStr(arr, i)}>×</button>
          </div>
        ))}
        <button type="button" className="admin-add-btn" onClick={() => pushStr(arr, '')}>+ Add URL</button>
      </div>
    );
  }
  if (field.type === 'rows') {
    const arr = value || [];
    return (
      <div>
        {(arr || []).map((row, i) => (
          <div key={i} style={{ border: '1px solid var(--admin-border)', borderRadius: '10px', padding: '12px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
              <button type="button" className="admin-remove-btn" onClick={() => removeRow(arr, i)}>Remove</button>
            </div>
            {field.subfields.map((sf) => (
              <div key={sf.key} style={{ marginBottom: '8px' }}>
                <label>{sf.label}</label>
                {sf.type === 'textarea'
                  ? <textarea rows={2} value={row[sf.key] || ''} onChange={(e) => setRow(arr, i, sf.key, e.target.value)} style={{ width: '100%' }} placeholder="..." />
                  : sf.type === 'image'
                    ? <input type="text" value={row[sf.key] || ''} onChange={(e) => setRow(arr, i, sf.key, e.target.value)} style={{ width: '100%' }} placeholder="https://example.com/logo.png" />
                    : <input type="text" value={row[sf.key] || ''} onChange={(e) => setRow(arr, i, sf.key, e.target.value)} style={{ width: '100%' }} />}
              </div>
            ))}
          </div>
        ))}
        <button type="button" className="admin-add-btn" onClick={() => pushRow(arr)}>+ Add Row</button>
      </div>
    );
  }
  if (field.type === 'object') {
    return (
      <div>
        {field.subfields.map((sf) => (
          <div key={sf.key} style={{ marginBottom: '8px' }}>
            <label>{sf.label}</label>
            {sf.type === 'strings'
              ? <FieldRenderer field={{ type: 'strings' }} value={(value || {})[sf.key]} onChange={(v) => set(sf.key, v)} />
              : <input type="text" value={(value || {})[sf.key] || ''} onChange={(e) => set(sf.key, e.target.value)} style={{ width: '100%' }} />}
          </div>
        ))}
      </div>
    );
  }
  return null;
}

function PageEditor({ page, onBack }) {
  const schema = SCHEMAS[page];
  const { hasPermission } = useAuth();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    contentApi.get(page).then((res) => {
      const loaded = res.data?.content?.data || {};
      if (page === 'about' && !loaded.stats) loaded.stats = DEFAULT_ABOUT_STATS;
      setData({ ...(PAGE_FALLBACKS[page] || {}), ...loaded });
    }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [page]);

  const perm = {
    home: 'home.update', about: 'about.update', business: 'business.update',
    learning: 'learning.update', contact: 'contact.update', csr: 'csr.update',
    mou: 'mou.update', footer: 'footer.update', careers: 'careers.update',
  }[page];

  const save = async () => {
    setSaving(true); setError('');
    try { await contentApi.update(page, data); setSaved(true); toast.success(`${schema.title} content saved.`); setTimeout(() => setSaved(false), 2000); }
    catch (err) { setError(err.message); toast.error(err.message || 'Save failed. Please try again.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="admin-card">
      <div className="admin-section-title">
        <span>Edit {schema.title} Content</span>
        <button className="admin-icon-btn" onClick={onBack}>{'<- Back'}</button>
      </div>

      {saved && <div className="admin-alert success">Content saved ✓</div>}
      {error && <div className="admin-alert error">{error}</div>}

      {loading ? <ShimmerPanel variant="form" header={false} /> : !hasPermission(perm) ? (
        <div className="admin-alert error">You do not have permission to edit this page.</div>
      ) : (
        <form
          className="admin-form"
          onSubmit={(e) => { e.preventDefault(); save(); }}
        >
          {schema.fields.map((f) => (
            <div className="field" key={f.key}>
              <label>{f.label}</label>
              <FieldRenderer field={f} value={data[f.key]} onChange={(v) => setData((d) => ({ ...d, [f.key]: v }))} />
            </div>
          ))}
          <button type="submit" className="admin-btn" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
        </form>
      )}
    </div>
  );
}

export default function ContentManagement() {
  const { hasPermission } = useAuth();
  const [editing, setEditing] = useState(null);

  const PERMS = {
    home: 'home.update', about: 'about.update', business: 'business.update',
    learning: 'learning.update', contact: 'contact.update', csr: 'csr.update',
    mou: 'mou.update', footer: 'footer.update', careers: 'careers.update',
  };

  if (editing) return <PageEditor key={editing} page={editing} onBack={() => setEditing(null)} />;

  const anyContentPerm = Object.values(PERMS).some((p) => hasPermission(p));

  return (
    <div>
      {!anyContentPerm ? (
        <div className="admin-403">
          <h2>403</h2>
          <p>You do not have permission to view this page.</p>
          <a href="/admin/dashboard" className="admin-btn">Back to Dashboard</a>
        </div>
      ) : (
        <>
      <h1>Website Content</h1>
      <p className="page-sub">Edit the text content shown across the public website.</p>
      <p className="admin-alert info" style={{ fontSize: '13px' }}>
        MOU listings, CSR project cards and Learning program cards are managed on their dedicated pages;
        the intro text for each is edited here.
      </p>

      <div className="admin-quick">
        {Object.keys(SCHEMAS).map((p) => (
          <a
            key={p}
            href="#"
            onClick={(e) => { e.preventDefault(); if (hasPermission(PERMS[p])) setEditing(p); }}
            style={!hasPermission(PERMS[p]) ? { opacity: 0.5, pointerEvents: 'none' } : {}}
          >
            {SCHEMAS[p].title}
            <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginTop: '4px', color: 'var(--admin-muted)' }}>Edit</span>
          </a>
        ))}
      </div>
        </>
      )}
    </div>
  );
}
