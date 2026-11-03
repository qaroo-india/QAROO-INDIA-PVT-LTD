import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import BusinessSolutionTemplate from './BusinessSolutionTemplate.jsx';
import { businessSolutionApi } from '../../api/businessSolutionApi.js';
import { Shimmer, ErrorState } from '../../components/ui/States';

function toTemplate(s) {
  return {
    slug: s.slug,
    pageName: s.pageName || s.title,
    metaTitle: s.seoTitle || `${s.pageName || s.title} - Qaroo India`,
    metaDescription: s.seoDescription || s.shortDescription || '',
    shortDescription: s.shortDescription || '',
    fullDescription: s.fullDescription || '',
    services: s.services || [],
    features: s.features || [],
    benefits: s.benefits || [],
    useCases: s.useCases || [],
    audience: s.audience || [],
    problems: s.problems || [],
    solutions: s.solutions || [],
    techniques: s.techniques || [],
    process: s.process || [],
    industries: s.industries || [],
    whyChoose: s.whyChoose || [],
    faq: s.faq || [],
  };
}

async function fetchOtherSolutions(currentSlug) {
  try {
    const res = await businessSolutionApi.list({}, { credentials: 'omit' });
    const list = res?.data?.solutions || [];
    return list.filter((s) => s.slug !== currentSlug).map(toTemplate);
  } catch {
    return [];
  }
}

export default function BusinessSolutionDetail() {
  const { slug } = useParams();
  const [solution, setSolution] = useState(null);
  const [others, setOthers] = useState([]);
  const [state, setState] = useState('loading'); // loading | ready | notfound | error
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setState('loading');
    setSolution(null);
    businessSolutionApi
      .getBySlug(slug, { credentials: 'omit' })
      .then((res) => {
        if (!active) return;
        const s = res?.data?.solution;
        if (!s) { setState('notfound'); return; }
        setSolution(toTemplate(s));
        setState('ready');
      })
      .catch((err) => {
        if (!active) return;
        if (err?.status === 404) { setState('notfound'); return; }
        setError(err?.message || 'We could not load this solution. Please try again.');
        setState('error');
      });

    fetchOtherSolutions(slug).then((o) => { if (active) setOthers(o); });
    return () => { active = false; };
  }, [slug]);

  if (state === 'loading' || (state === 'ready' && !solution)) {
    return <Shimmer />;
  }

  if (state === 'notfound') {
    return (
      <div className="page-section" style={{ minHeight: '50vh', display: 'flex', alignItems: 'center' }}>
        <ErrorState
          title="Solution not found"
          text="We could not find that business solution. It may have been unpublished or removed."
          action={<Link to="/business-solutions" className="btn-eduact">Browse all solutions</Link>}
        />
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="page-section" style={{ minHeight: '50vh', display: 'flex', alignItems: 'center' }}>
        <ErrorState title="Something went wrong" text={error} action={<Link to="/business-solutions" className="btn-eduact">Browse all solutions</Link>} />
      </div>
    );
  }

  return <BusinessSolutionTemplate solution={solution} otherSolutions={others} />;
}
