import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProgramTemplate from './ProgramTemplate.jsx';
import { learningApi } from '../../api/learningApi.js';
import { Shimmer, ErrorState } from '../../components/ui/States';
import { PROGRAMS } from '../../data/programs.js';
import { SEO_PAGES } from '../../data/seoData.js';

// Maps a DB LearningProgram record into the props ProgramTemplate expects.
function toTemplate(program) {
  return {
    slug: program.slug,
    pageName: program.pageName || program.title,
    shortDescription: program.shortDescription || program.desc || '',
    fullDescription: program.fullDescription || program.desc || '',
    metaTitle: program.seoTitle || program.metaTitle || `${program.title} - Qaroo India`,
    metaDescription: program.seoDescription || program.metaDescription || program.shortDescription || program.desc || '',
    highlights: program.highlights || [],
    learn: program.learn || [],
    tools: program.tools || [],
    modules: program.modules || [],
    careers: program.careers || [],
    audience: program.audience || [],
    benefits: program.benefits || [],
    certification: program.certification || '',
    placement: program.placement || '',
    modes: program.modes || [],
    faq: program.faq || [],
  };
}

function getLocalProgramFallback(slug) {
  const local = PROGRAMS.find((p) => p.slug === slug);
  if (!local) return null;
  return toTemplate({
    ...local,
    title: local.pageName || local.courseName,
    desc: local.shortDescription
  });
}

async function fetchOtherPrograms(currentSlug) {
  try {
    const res = await learningApi.list({}, { credentials: 'omit' });
    const list = res?.data?.programs || [];
    if (list.length) {
      return list.filter((p) => p.slug !== currentSlug).map(toTemplate);
    }
  } catch {
    // ignore
  }
  return PROGRAMS.filter((p) => p.slug !== currentSlug).slice(0, 3).map((p) => toTemplate({ ...p, title: p.pageName || p.courseName }));
}

export default function CourseDetailPage() {
  const { slug } = useParams();
  const [program, setProgram] = useState(null);
  const [others, setOthers] = useState([]);
  const [state, setState] = useState('loading'); // loading | ready | notfound | error
  const [error, setError] = useState('');

  // Determine if this is an SEO keyword course URL (/courses/...) or internal slug
  const seoEntry = SEO_PAGES[`/courses/${slug}`];
  const targetSlug = seoEntry?.internalSlug || slug;

  useEffect(() => {
    let active = true;
    setState('loading');
    setProgram(null);

    learningApi
      .getBySlug(targetSlug, { credentials: 'omit' })
      .then((res) => {
        if (!active) return;
        const p = res?.data?.program;
        if (p) {
          setProgram(toTemplate(p));
          setState('ready');
        } else {
          // Fallback to local program definition
          const fallback = getLocalProgramFallback(targetSlug);
          if (fallback) {
            setProgram(fallback);
            setState('ready');
          } else {
            setState('notfound');
          }
        }
      })
      .catch((err) => {
        if (!active) return;
        // Fallback to local program definition
        const fallback = getLocalProgramFallback(targetSlug);
        if (fallback) {
          setProgram(fallback);
          setState('ready');
        } else if (err?.status === 404) {
          setState('notfound');
        } else {
          setError(err?.message || 'We could not load this program. Please try again.');
          setState('error');
        }
      });

    fetchOtherPrograms(targetSlug).then((o) => { if (active) setOthers(o); });
    return () => { active = false; };
  }, [targetSlug]);

  if (state === 'loading' || (state === 'ready' && !program)) {
    return <Shimmer />;
  }

  if (state === 'notfound') {
    return (
      <div className="page-section" style={{ minHeight: '50vh', display: 'flex', alignItems: 'center' }}>
        <ErrorState
          title="Course not found"
          text="We could not find that course. It may have been renamed or removed."
          action={<Link to="/courses" className="btn-eduact">Browse all courses</Link>}
        />
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="page-section" style={{ minHeight: '50vh', display: 'flex', alignItems: 'center' }}>
        <ErrorState title="Something went wrong" text={error} action={<Link to="/courses" className="btn-eduact">Browse all courses</Link>} />
      </div>
    );
  }

  return <ProgramTemplate program={program} otherPrograms={others} seoData={seoEntry} />;
}
