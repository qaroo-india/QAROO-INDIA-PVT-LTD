import { useState, useEffect, useRef, useCallback } from 'react';
import { safeHref } from '../utils/safeHref.js';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import Stepper, { Step } from '../components/Stepper';
import Seo from '../components/Seo.jsx';
import { Shimmer, EmptyState, ErrorState } from '../components/ui/States';
import { learningApi } from '../api/learningApi.js';
import { contentApi } from '../api/contentApi.js';
import TiltCard from '../components/TiltCard.jsx';
import PageHero from '../components/PageHero';

const DEFAULT_LEARNING_STEPS = [
  { title: 'Connect', desc: 'Browse our career tracks and submit an enquiry. Our team will reach out within 24 hours to discuss your background and goals.' },
  { title: 'Evaluate', desc: 'We assess your current skills and learning needs to recommend the right track and pace for your journey.' },
  { title: 'Mentor', desc: 'Speak one-on-one with our career counselor to finalize the best track for your goals, batch timing, duration and fee structure.' },
  { title: 'Lock It In', desc: 'Complete your enrollment with flexible payment options. Get access to pre-reading materials and orientation.' },
  { title: 'Upskill', desc: 'Hands-on projects, live sessions, and mentorship from industry professionals. Build your portfolio as you learn.' },
  { title: 'Ace', desc: 'Complete your capstone project and earn your certification. Our placement support helps you land your next role.' },
];

function categoryOf(track) {
  const t = `${track.title || ''} ${track.slug || ''}`.toLowerCase();
  if (/animation|vfx/.test(t)) return 'Animation & VFX';
  if (/cyber|security|hacking/.test(t)) return 'Security';
  if (/\bai\b|machine|artificial/.test(t)) return 'AI & ML';
  if (/data|analytics/.test(t)) return 'Data & Analytics';
  if (/design/.test(t)) return 'Design';
  if (/full ?stack|development|software|testing/.test(t)) return 'Development';
  return 'Other';
}

export default function LearningPrograms() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [content, setContent] = useState({});
  const [filter, setFilter] = useState('All');
  const aliveRef = useRef(true);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    learningApi
      .list({}, { credentials: 'omit' })
      .then((res) => { if (aliveRef.current) setTracks(res.data.programs || []); })
      .catch((err) => { if (aliveRef.current) setError(err?.message || 'We could not load the programs. Please try again.'); })
      .finally(() => { if (aliveRef.current) setLoading(false); });
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    reload();
    contentApi
      .get('learning', { credentials: 'omit' })
      .then((res) => { if (aliveRef.current) setContent(res?.data?.content?.data || {}); })
      .catch(() => {});
    return () => { aliveRef.current = false; };
  }, [reload]);

  const links = Array.isArray(content.links) ? content.links.filter(Boolean) : [];
  const steps = Array.isArray(content.steps) && content.steps.length > 0 ? content.steps : DEFAULT_LEARNING_STEPS;
  const categories = tracks.length
    ? ['All', ...new Set(tracks.map(categoryOf))]
    : ['All'];
  const filtered = filter === 'All' ? tracks : tracks.filter((t) => categoryOf(t) === filter);

  // Counted from the published programs, so the figures cannot drift from the
  // list below them.
  const heroFacts = tracks.length
    ? [
        { num: tracks.length, label: tracks.length === 1 ? 'Program' : 'Programs' },
        {
          num: categories.length - 1,
          label: categories.length === 2 ? 'Career track' : 'Career tracks',
        },
      ]
    : [];

  return (
    <>
      <Seo
        title="Learning Programs & Career Tracks - Qaroo India Private Limited | Data Science, Full Stack, UI/UX, Cyber Security, AI"
        description="Career-ready IT learning programs from Qaroo India Private Limited: Data Science & Business Analytics, Full Stack Development, UI/UX Design, Cyber Security, AI & Machine Learning, Graphic Design and Software Testing."
        path="/learning-programs"
      />
      <PageHero padding="80px 0 100px" facts={heroFacts}>
        <span className="eyebrow">Learning Programs</span>
        <h1 style={{
          fontFamily: 'var(--heading-font)',
          fontWeight: 800,
          color: '#fff',
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          marginTop: '10px',
        }}>{content.heading || 'Skills that move your career forward.'}</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '560px', marginTop: '14px' }}>
          {content.description || 'Practical, project-based training across technology, design and analytics - grouped by career path.'}
        </p>
      </PageHero>

      {/* Enrollment Stepper */}
      <section className="page-section">
        <Container>
          <div className="section-head reveal">
            <div>
              <p className="eyebrow">{content.eyebrow || 'The Qaroo Launchpad'}</p>
              <h2>{content.stepperHeading || 'From enquiry to certification in 6 steps.'}</h2>
            </div>
            <p className="desc">{content.stepperDesc || 'Our structured enrollment process ensures you get the right training for your career goals.'}</p>
          </div>

          <div className="reveal" style={{ maxWidth: '700px', margin: '0 auto' }}>
            <Stepper
              initialStep={1}
              backButtonText="Previous"
              nextButtonText="Next"
            >
              {steps.map((s, i) => (
                <Step key={s.title || i}>
                  <h2 style={{ fontSize: '20px', marginBottom: '8px', color: 'var(--eduact-black)' }}>Step {i + 1}: {s.title}</h2>
                  <p style={{ color: 'var(--eduact-text)', fontSize: '15px' }}>
                    {s.desc}
                  </p>
                </Step>
              ))}
            </Stepper>
          </div>
        </Container>
      </section>

      <Container className="page-section" style={{ paddingTop: 0 }}>
        <div className="reveal">
          <p className="eyebrow">Available Career Tracks</p>
          <h2 style={{ fontSize: '28px', marginBottom: '20px' }}>Choose your path</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '32px' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '999px',
                  border: '1px solid var(--eduact-soft4)',
                  fontFamily: 'var(--heading-font)',
                  fontWeight: 600,
                  fontSize: '13px',
                  color: filter === cat ? '#fff' : 'var(--eduact-text)',
                  background: filter === cat ? 'var(--eduact-base)' : 'transparent',
                  borderColor: filter === cat ? 'var(--eduact-base)' : 'var(--eduact-soft4)',
                  transition: 'background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease',
                  cursor: 'pointer',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <Row className="g-4 reveal-stagger">
          {loading ? (
            <div style={{ width: '100%' }}><Shimmer /></div>
          ) : error ? (
            <div style={{ width: '100%' }}><ErrorState title="Couldn't load programs" text={error} onRetry={reload} /></div>
          ) : filtered.length === 0 ? (
            <div style={{ width: '100%' }}>
              <EmptyState
                title={tracks.length === 0 ? 'Programs coming soon' : 'No programs in this track yet'}
                text={tracks.length === 0 ? 'No learning programs are published right now. Check back shortly, or contact us for the full curriculum.' : 'Try another category, or contact us for the full curriculum.'}
                action={<Link to="/contact" className="btn-eduact">Contact Us</Link>}
              />
            </div>
          ) : filtered.map((track, i) => {
            const slug = track.slug;
            const detailPath = slug ? `/learning-programs/${slug}` : '/contact';
            return (
            <Col key={track._id || i} md={6} lg={4}>
              <TiltCard>
              <Link
                to={detailPath}
                className="eduact-card track-card"
                aria-label={`Open ${track.title} course details`}
              >
                <span className="idx">Career Track {String(i + 1).padStart(2, '0')}</span>
                <h4>{track.title}</h4>
                <p>{track.desc || track.shortDescription}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                  {(track.skills || []).map((skill) => (
                    <span key={skill} style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--eduact-base)',
                      background: 'var(--eduact-soft3)',
                      padding: '4px 10px',
                      borderRadius: '999px',
                    }}>{skill}</span>
                  ))}
                </div>
                <div style={{ marginTop: '16px' }}>
                  <span
                    className="btn-eduact"
                    style={{ fontSize: '13px', padding: '9px 16px', textDecoration: 'none', display: 'inline-block' }}
                  >
                    View course details
                  </span>
                </div>
              </Link>
              </TiltCard>
            </Col>
            );
          })}
        </Row>

        <div className="mt-5 pt-4 reveal text-center">
          <p className="eyebrow">Ready to upskill?</p>
          <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Request the full curriculum.</h2>
          <Link to="/contact" className="btn-eduact">Request Course Details</Link>
        </div>

        {links.length > 0 && (
          <div className="mt-5 pt-4 reveal">
            <p className="eyebrow" style={{ textAlign: 'center' }}>Useful Links</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
              {links.map((url, i) => (
                <a key={i} href={safeHref(url)} target="_blank" rel="noopener noreferrer"
                   className="btn-eduact" style={{ fontSize: '14px', padding: '10px 18px' }}>
                  {url.replace(/^https?:\/\//, '').replace(/\/$/, '') || url}
                </a>
              ))}
            </div>
          </div>
        )}
      </Container>
    </>
  );
}
