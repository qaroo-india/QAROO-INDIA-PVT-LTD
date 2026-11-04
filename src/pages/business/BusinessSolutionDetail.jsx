import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import BusinessSolutionTemplate from './BusinessSolutionTemplate.jsx';
import { businessSolutionApi } from '../../api/businessSolutionApi.js';
import { Shimmer, ErrorState } from '../../components/ui/States';
import { BUSINESS_SOLUTIONS } from '../../data/businessSolutions.js';
import { SEO_PAGES } from '../../data/seoData.js';

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

function getLocalSolutionFallback(slug) {
  const local = BUSINESS_SOLUTIONS.find((s) => s.slug === slug);
  if (!local) return null;
  return toTemplate({
    ...local,
    title: local.pageName,
    shortDescription: local.shortDescription
  });
}

async function fetchOtherSolutions(currentSlug) {
  try {
    const res = await businessSolutionApi.list({}, { credentials: 'omit' });
    const list = res?.data?.solutions || [];
    if (list.length) {
      return list.filter((s) => s.slug !== currentSlug).map(toTemplate);
    }
  } catch {
    // ignore
  }
  return BUSINESS_SOLUTIONS.filter((s) => s.slug !== currentSlug).slice(0, 3).map((s) => toTemplate({ ...s, title: s.pageName }));
}

export default function BusinessSolutionDetail() {
  const { slug } = useParams();
  const [solution, setSolution] = useState(null);
  const [others, setOthers] = useState([]);
  const [state, setState] = useState('loading'); // loading | ready | notfound | error
  const [error, setError] = useState('');

  // Determine if this is an SEO keyword service URL (/services/...) or internal slug
  const seoEntry = SEO_PAGES[`/services/${slug}`];
  const targetSlug = seoEntry?.internalSlug || slug;

  useEffect(() => {
    let active = true;
    setState('loading');
    setSolution(null);

    businessSolutionApi
      .getBySlug(targetSlug, { credentials: 'omit' })
      .then((res) => {
        if (!active) return;
        const s = res?.data?.solution;
        if (s) {
          setSolution(toTemplate(s));
          setState('ready');
        } else {
          const fallback = getLocalSolutionFallback(targetSlug);
          if (fallback) {
            setSolution(fallback);
            setState('ready');
          } else {
            setState('notfound');
          }
        }
      })
      .catch((err) => {
        if (!active) return;
        const fallback = getLocalSolutionFallback(targetSlug);
        if (fallback) {
          setSolution(fallback);
          setState('ready');
        } else if (err?.status === 404) {
          setState('notfound');
        } else {
          setError(err?.message || 'We could not load this solution. Please try again.');
          setState('error');
        }
      });

    fetchOtherSolutions(targetSlug).then((o) => { if (active) setOthers(o); });
    return () => { active = false; };
  }, [targetSlug]);

  if (state === 'loading' || (state === 'ready' && !solution)) {
    return <Shimmer />;
  }

  if (state === 'notfound') {
    return (
      <div className="page-section" style={{ minHeight: '50vh', display: 'flex', alignItems: 'center' }}>
        <ErrorState
          title="Solution not found"
          text="We could not find that business solution. It may have been renamed or removed."
          action={<Link to="/services" className="btn-eduact">Browse all solutions</Link>}
        />
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="page-section" style={{ minHeight: '50vh', display: 'flex', alignItems: 'center' }}>
        <ErrorState title="Something went wrong" text={error} action={<Link to="/services" className="btn-eduact">Browse all solutions</Link>} />
      </div>
    );
  }

  return <BusinessSolutionTemplate solution={solution} otherSolutions={others} seoData={seoEntry} />;
}
