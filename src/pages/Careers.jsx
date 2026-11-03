import { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Seo from '../components/Seo.jsx';
import Icon from '../components/Icon';
import GlareHover from '../components/GlareHover';
import { Shimmer, EmptyState, ErrorState } from '../components/ui/States';
import { careerApi } from '../api/careerApi.js';
import { contentApi } from '../api/contentApi.js';
import { CAREERS_PAGE } from '../data/careers.js';
import './careers/Careers.css';
import PageHero from '../components/PageHero';
import PageBackdrop from '../components/PageBackdrop.jsx';
import LinedSection from '../components/LinedSection.jsx';
import { SITE_URL } from '../data/site.js';

const SITE = SITE_URL;

export default function Careers() {
  const [content, setContent] = useState(CAREERS_PAGE);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');

  // Page copy is editable in the admin but falls back to the shipped content,
  // so the page is never blank if the API is unreachable.
  useEffect(() => {
    let active = true;
    contentApi
      .get('careers', { credentials: 'omit' })
      .then((res) => {
        if (active && res?.data?.content?.data) {
          setContent({ ...CAREERS_PAGE, ...res.data.content.data });
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Vacancies come from the API only - a stale hardcoded list would advertise
  // roles that are no longer open.
  useEffect(() => {
    let active = true;
    setLoading(true);
    careerApi
      .list({}, { credentials: 'omit' })
      .then((res) => {
        if (active) setJobs(res?.data?.jobs || []);
      })
      .catch((err) => {
        if (active) setError(err?.message || 'We could not load open positions.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const departments = useMemo(
    () => ['All', ...new Set(jobs.map((j) => j.department).filter(Boolean))],
    [jobs],
  );

  const visible = useMemo(
    () => (filter === 'All' ? jobs : jobs.filter((j) => j.department === filter)),
    [filter, jobs],
  );

  // Hero figures, counted from the postings the page already loaded. Empty
  // until they arrive, so the band never shows a confident "0 open roles"
  // while the request is still in flight.
  const heroFacts = jobs.length
    ? [
        { num: jobs.length, label: jobs.length === 1 ? 'Open role' : 'Open roles' },
        {
          num: departments.length - 1,
          label: departments.length === 2 ? 'Team hiring' : 'Teams hiring',
        },
      ]
    : [];

  const faqSchema = content.faq?.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: content.faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      }
    : null;

  return (
    <div className="careers-page">
      <PageBackdrop />

      <Seo
        title={content.seoTitle}
        description={content.seoDescription}
        path="/careers"
        jsonLd={faqSchema}
        jsonLdId="careers-faq"
      />

      <PageHero padding="80px 0 100px" facts={heroFacts}>
        <span className="eyebrow">{content.eyebrow}</span>
        <h1
          style={{
            fontFamily: 'var(--heading-font)',
            fontWeight: 800,
            color: '#fff',
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            marginTop: '10px',
          }}
        >
          {content.title}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.78)', maxWidth: '620px', marginTop: '14px' }}>
          {content.intro}
        </p>
      </PageHero>

      <LinedSection>
        <div className="section-head reveal">
          <div>
            <p className="eyebrow">Where we hire</p>
            <h2>{content.scope}</h2>
          </div>
          <p className="desc">{content.belief}</p>
        </div>

        {/* Open positions */}
        <div className="reveal" id="positions">
          {departments.length > 2 && (
            <div className="careers-filters">
              {departments.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setFilter(d)}
                  className={`careers-filter${filter === d ? ' is-active' : ''}`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <Shimmer cards={3} />
          ) : error ? (
            <ErrorState title="Could not load open positions" text={error} />
          ) : !visible.length ? (
            <EmptyState
              title="No open positions right now"
              text="We are not advertising vacancies at the moment. Do send your details through the contact page and we will keep them on file."
            />
          ) : (
            <Row className="g-4">
              {visible.map((job) => (
                <Col key={job._id || job.slug} md={6} lg={4}>
                  <GlareHover
                    width="100%"
                    height="100%"
                    background="#fff"
                    borderRadius="16px"
                    borderColor="var(--eduact-soft4)"
                    glareColor="#F4C430"
                    glareOpacity={0.14}
                    glareAngle={-30}
                    glareSize={250}
                    transitionDuration={700}
                    playOnce={false}
                    style={{ display: 'block', padding: '26px 24px' }}
                  >
                    <span className="idx">{job.department || 'Open Position'}</span>
                    <h4 className="careers-card__title">{job.pageName || job.title}</h4>
                    <ul className="careers-card__facts">
                      {job.jobType ? (
                        <li>
                          <Icon name="briefcase" size={14} />
                          {job.jobType}
                        </li>
                      ) : null}
                      {job.experience ? (
                        <li>
                          <Icon name="chart" size={14} />
                          {job.experience}
                        </li>
                      ) : null}
                    </ul>
                    <p className="careers-card__desc">
                      {(job.overview || '').split('\n\n')[0]}
                    </p>
                    <Link to={`/careers/${job.slug}`} className="careers-card__link">
                      View role &amp; apply
                      <Icon name="arrow-right" size={15} strokeWidth={2} />
                    </Link>
                  </GlareHover>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </LinedSection>

      {/* Recruitment process */}
      <section className="page-section dark">
        <Container>
          <div className="section-head reveal">
            <div>
              <p className="eyebrow">How we hire</p>
              <h2>{content.processTitle}</h2>
            </div>
            <p className="desc muted">{content.processNote}</p>
          </div>

          <Row className="g-4 reveal-stagger">
            {(content.rounds || []).map((round) => (
              <Col key={round.title} lg={4}>
                <div className="careers-round">
                  <h3>{round.title}</h3>
                  <p>{round.desc}</p>
                  {(round.groups || []).map((group) => (
                    <div key={group.title || 'items'} className="careers-round__group">
                      {group.title ? <h4>{group.title}</h4> : null}
                      <ul>
                        {(group.items || []).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* What we look for */}
      <LinedSection>
        <div className="section-head reveal">
          <div>
            <p className="eyebrow">Beyond the CV</p>
            <h2>{content.lookForTitle}</h2>
          </div>
          <p className="desc">{content.lookForIntro}</p>
        </div>
        <Row className="g-4 reveal-stagger">
          {(content.lookFor || []).map((item) => (
            <Col key={item.title} md={6} lg={4}>
              <div className="eduact-card">
                <h4>{item.title}</h4>
                <p>{item.desc}</p>
              </div>
            </Col>
          ))}
        </Row>
      </LinedSection>

      {/* Growth path */}
      <section className="page-section dark" style={{ paddingTop: 0 }}>
        <Container>
          <div className="section-head reveal">
            <div>
              <p className="eyebrow">{content.growthIntro}</p>
              <h2>{content.growthTitle}</h2>
            </div>
            <p className="desc muted">{content.growthNote}</p>
          </div>
          <ol className="careers-ladder reveal-stagger">
            {(content.growth || []).map((step, i) => (
              <li key={step}>
                <span className="careers-ladder__n">{String(i + 1).padStart(2, '0')}</span>
                {step}
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* FAQ */}
      {content.faq?.length ? (
        <LinedSection maxWidth='820px'>
          <div className="section-head reveal">
            <div>
              <p className="eyebrow">FAQ</p>
              <h2 style={{ fontSize: '26px' }}>Common questions</h2>
            </div>
          </div>
          <div className="reveal">
            {content.faq.map((f, i) => (
              <details key={f.q} className="faq-item" open={i === 0}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </LinedSection>
      ) : null}

      {/* CTA */}
      <div style={{ background: 'var(--eduact-black)', color: '#fff', padding: '72px 0' }}>
        <Container className="reveal">
          <p className="eyebrow">{content.ctaLabel}</p>
          <h2 style={{ fontSize: '28px', color: '#fff', marginBottom: '12px' }}>
            {content.ctaTitle}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '680px', marginBottom: '24px' }}>
            {content.ctaBody}
          </p>
          <div className="d-flex flex-wrap" style={{ gap: '12px' }}>
            <a href="#positions" className="btn-eduact-secondary">
              View Open Positions
            </a>
            <Link
              to="/contact"
              className="btn-eduact-outline"
              style={{ borderColor: 'rgba(255,255,255,0.24)', color: '#fff' }}
            >
              Contact the team
            </Link>
          </div>
          <p className="visually-hidden-focusable" style={{ display: 'none' }}>
            {SITE}/careers
          </p>
        </Container>
      </div>
    </div>
  );
}
