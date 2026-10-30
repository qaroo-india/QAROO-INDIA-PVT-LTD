import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProgramTemplate from './ProgramTemplate.jsx';
import { learningApi } from '../../api/learningApi.js';
import { Shimmer, ErrorState } from '../../components/ui/States';
import { Link } from 'react-router-dom';

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

async function fetchOtherPrograms(currentSlug) {
  try {
    const res = await learningApi.list({}, { credentials: 'omit' });
    const list = res?.data?.programs || [];
    return list.filter((p) => p.slug !== currentSlug).map(toTemplate);
  } catch {
    return [];
  }
}

export default function CourseDetailPage() {
  const { slug } = useParams();
  const [program, setProgram] = useState(null);
  const [others, setOthers] = useState([]);
  const [state, setState] = useState('loading'); // loading | ready | notfound | error
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setState('loading');
    setProgram(null);
    learningApi
      .getBySlug(slug, { credentials: 'omit' })
      .then((res) => {
        if (!active) return;
        const p = res?.data?.program;
        if (!p) { setState('notfound'); return; }
        setProgram(toTemplate(p));
        setState('ready');
      })
      .catch((err) => {
        if (!active) return;
        if (err?.status === 404) { setState('notfound'); return; }
        setError(err?.message || 'We could not load this program. Please try again.');
        setState('error');
      });

    fetchOtherPrograms(slug).then((o) => { if (active) setOthers(o); });
    return () => { active = false; };
  }, [slug]);

  if (state === 'loading' || (state === 'ready' && !program)) {
    return <Shimmer />;
  }

  if (state === 'notfound') {
    return (
      <div className="page-section" style={{ minHeight: '50vh', display: 'flex', alignItems: 'center' }}>
        <ErrorState
          title="Program not found"
          text="We could not find that learning program. It may have been unpublished or removed."
          action={<Link to="/learning-programs" className="btn-eduact">Browse all programs</Link>}
        />
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="page-section" style={{ minHeight: '50vh', display: 'flex', alignItems: 'center' }}>
        <ErrorState title="Something went wrong" text={error} action={<Link to="/learning-programs" className="btn-eduact">Browse all programs</Link>} />
      </div>
    );
  }

  return <ProgramTemplate program={program} otherPrograms={others} />;
}
