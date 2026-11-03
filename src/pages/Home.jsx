import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import HomeHero from '../components/HomeHero';
import MagicBento from '../components/MagicBento';
import CountUp from '../components/CountUp';
import GlareHover from '../components/GlareHover';
import FeatureLine from '../components/FeatureLine';
import Seo from '../components/Seo.jsx';
import { contentApi } from '../api/contentApi.js';
import { statsApi } from '../api/statsApi.js';
import { learningApi } from '../api/learningApi.js';
import { COMPANY } from '../data/company.js';
import { businessSolutionApi } from '../api/businessSolutionApi.js';
import { BUSINESS_LINKS, LEARNING_LINKS } from '../data/catalog.js';

const DEFAULT_HOME = {
  heroEyebrow: 'Coimbatore - Chennai',
  heroTitle: 'Business solutions and career-ready skills, from One Team.',
  heroDescription:
    'Qaroo India Private Limited builds digital solutions for businesses - CRM, marketing, design, software, strategy - and builds careers for people through practical, industry-linked training.',
  buttons: [
    { text: 'Explore Business Solutions', link: '/business-solutions', style: 'yellow' },
    { text: 'Explore Learning Programs', link: '/learning-programs', style: 'white' },
  ],
  statistics: [
    { num: 20, label: 'Memorandums of Understanding (MoUs) signed' },
    { num: 12, label: 'CSR projects delivered' },
    { num: 2, label: 'Office locations - Coimbatore & Chennai' },
  ],
  partners: ['Infosys Foundation', 'EduBridge', 'Atos Prayas Foundation', 'Canara Bank', 'AISECT', 'SNS College of Engineering', 'Dr. SNS Rajalakshmi College', 'Narayana Engineering College Nellore', 'Nayago Educational Trust'],
};

// Counts of the service pages and career tracks the site ships with, used until
// the published lists come back from the API.
const DEFAULT_SERVICE_COUNT = 8;
const DEFAULT_TRACK_COUNT = 7;

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Do you work with businesses and train individuals at the same time?',
      acceptedAnswer: { '@type': 'Answer', text: 'Yes - Business Solutions and Learning are two divisions of the same organization, run to the same standard.' },
    },
    {
      '@type': 'Question',
      name: 'Where are you based?',
      acceptedAnswer: { '@type': 'Answer', text: 'Head office in Coimbatore, branch office in Chennai (Pallavaram). Both business and learning enquiries can reach either office.' },
    },
    {
      '@type': 'Question',
      name: 'How do I see your CSR project history?',
      acceptedAnswer: { '@type': 'Answer', text: 'The CSR Projects section on our website lists our programs by year - 2024-25 and 2025-26 - with full details added as each project is confirmed.' },
    },
    {
      '@type': 'Question',
      name: 'What is the MOU Directory?',
      acceptedAnswer: { '@type': 'Answer', text: 'Our MOU Directory documents every memorandum of understanding on record - who the partner is, what it can offer students, and our assessment of how strong the collaboration actually is.' },
    },
  ],
};

// Keeps the two path cards' buttons on one row: the auto top margin takes
// whatever space the shorter list leaves, and flex-start stops the button
// stretching to the full width of the column.
const BOTTOM_CTA = { marginTop: 'auto', alignSelf: 'flex-start' };

export default function Home() {
  const [csrTab, setCsrTab] = useState('24-25');
  const [home, setHome] = useState(DEFAULT_HOME);
  // Figures behind the "What we do" cards. Each starts on the count the static
  // page already states and is replaced by the published record count when its
  // request resolves; `live` only flips once real data arrived, so the badge
  // never claims to be live over a fallback.
  // Every service page and career track, by name. Seeded from the shared
  // catalogue so the lists are complete on the first paint, then replaced
  // by whatever is actually published.
  const [catalog, setCatalog] = useState({
    services: BUSINESS_LINKS.map((x) => x.label),
    tracks: LEARNING_LINKS.map((x) => x.label),
  });
  const [metrics, setMetrics] = useState({
    services: { value: DEFAULT_SERVICE_COUNT, live: false },
    tracks: { value: DEFAULT_TRACK_COUNT, live: false },
    csr: { value: DEFAULT_HOME.statistics[1].num, live: false },
    mou: { value: DEFAULT_HOME.statistics[0].num, live: false },
  });

  useEffect(() => {
    let active = true;
    contentApi
      .get('home', { credentials: 'omit' })
      .then((res) => {
        if (active && res?.data?.content?.data) {
          const d = res.data.content.data;
          setHome({ ...DEFAULT_HOME, ...d, statistics: d.statistics || DEFAULT_HOME.statistics, buttons: d.buttons || DEFAULT_HOME.buttons });
        }
      })
      .catch(() => { });
    return () => { active = false; };
  }, []);

  // Live counts from the backend - replaces the hardcoded MoU / CSR totals so
  // public stats update automatically whenever an admin adds or removes a
  // published MOU or CSR project.
  useEffect(() => {
    let active = true;
    statsApi
      .getStats()
      .then((res) => {
        if (!active || !res?.data) return;
        const { mouCount, csrCount } = res.data;
        setMetrics((prev) => ({
          ...prev,
          csr: { value: csrCount, live: true },
          mou: { value: mouCount, live: true },
        }));
      })
      .catch(() => { });
    return () => { active = false; };
  }, []);

  // Published service pages and career tracks, for the card metrics. Same two
  // endpoints the navbar already calls, so this is usually served from cache.
  useEffect(() => {
    let active = true;
    Promise.all([
      businessSolutionApi.list({}, { credentials: 'omit' }).catch(() => null),
      learningApi.list({}, { credentials: 'omit' }).catch(() => null),
    ]).then(([bres, lres]) => {
      if (!active) return;
      const services = (bres?.data?.solutions || []).filter((x) => x.status === 'published');
      const tracks = (lres?.data?.programs || []).filter((x) => x.status === 'published');
      setMetrics((prev) => ({
        ...prev,
        services: services.length ? { value: services.length, live: true } : prev.services,
        tracks: tracks.length ? { value: tracks.length, live: true } : prev.tracks,
      }));
      // Same field order the navbar uses, so both name a page the same way.
      setCatalog((prev) => ({
        services: services.length ? services.map((x) => x.pageName || x.title) : prev.services,
        tracks: tracks.length ? tracks.map((x) => x.title || x.pageName) : prev.tracks,
      }));
    });
    return () => { active = false; };
  }, []);

  // The stats endpoint counts published records; the content record carries a
  // number someone typed into the admin panel. The live count wins wherever
  // both exist, whichever request happens to land first.
  const statistics = (home.statistics || DEFAULT_HOME.statistics).map((stat, i) => {
    if (i === 0 && metrics.mou.live) return { ...stat, num: metrics.mou.value };
    if (i === 1 && metrics.csr.live) return { ...stat, num: metrics.csr.value };
    return stat;
  });
  const mouCount = statistics[0]?.num ?? DEFAULT_HOME.statistics[0].num;

  // FAQPage structured data - injected into <head> because script elements
  // created via innerHTML are not executed by browsers.
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-faq-schema', 'qaroo-faq');
    script.textContent = JSON.stringify(FAQ_SCHEMA);
    document.head.appendChild(script);
    return () => {
      const existing = document.head.querySelector('script[data-faq-schema="qaroo-faq"]');
      if (existing) existing.remove();
    };
  }, []);

  return (
    <>
      <Seo
        title="Qaroo India Private Limited - Business Solutions & Career-Ready Learning"
        description="Qaroo India Private Limited delivers business solutions - CRM, digital marketing, design, web & software development, strategy - plus career-ready IT learning programs. Head office Coimbatore, branch office Chennai."
        path="/"
      />
      {/* ========== HERO - deep-red stage with interactive background atoms ========== */}
      <HomeHero
        heroEyebrow={home.heroEyebrow}
        heroTitle={home.heroTitle}
        heroDescription={home.heroDescription}
        buttons={home.buttons}
        mouCount={mouCount}
      />

      {/* ========== TWO PATHS ========== */}
      <section className="page-section" id="two-paths">
        <Container>
          <div className="section-head reveal">
            <div>
              <p className="eyebrow">Where business problems meet digital expertise</p>
              <h2>Two divisions, working from the same standard.</h2>
            </div>
            <p className="desc">Businesses need digital talent. Professionals need practical skills. Qaroo India Private Limited operates at the intersection of both.</p>
          </div>

          <div className="reveal" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2px',
            background: 'var(--eduact-soft4)',
            border: '1px solid var(--eduact-soft4)',
            borderRadius: '18px',
            overflow: 'hidden',
          }}>
            <GlareHover
              width="100%"
              height="100%"
              background="#fff"
              borderRadius="0"
              borderColor="transparent"
              glareColor="#F4C430"
              glareOpacity={0.15}
              glareAngle={-30}
              glareSize={300}
              transitionDuration={800}
              playOnce={false}
              style={{ padding: '44px 40px', display: 'flex', flexDirection: 'column' }}
            >
              <p className="eyebrow">For businesses</p>
              <h3 className="two-path-title" style={{ fontSize: '26px', marginBottom: '14px' }}>Business Solutions</h3>
              <p style={{ color: 'var(--eduact-text)', fontSize: '15px', marginBottom: '22px', maxWidth: '420px' }}>
                Strategy, design and technology work for teams that need to grow, transform, or ship something real.
              </p>
              <ul className="feature-list" style={{ margin: '0 0 26px' }}>
                {catalog.services.map((item) => (
                  <FeatureLine key={item} label={item} />
                ))}
              </ul>
              <Link to="/business-solutions" className="btn-eduact" style={BOTTOM_CTA}>Explore Business</Link>
            </GlareHover>
            <GlareHover
              width="100%"
              height="100%"
              background="#fff"
              borderRadius="0"
              borderColor="transparent"
              glareColor="#F4C430"
              glareOpacity={0.15}
              glareAngle={-30}
              glareSize={300}
              transitionDuration={800}
              playOnce={false}
              style={{ padding: '44px 40px', display: 'flex', flexDirection: 'column' }}
            >
              <p className="eyebrow">For learners</p>
              <h3 className="two-path-title" style={{ fontSize: '26px', marginBottom: '14px' }}>Learning Programs</h3>
              <p style={{ color: 'var(--eduact-text)', fontSize: '15px', marginBottom: '22px', maxWidth: '420px' }}>
                Industry-linked training across technology, design and analytics - built around real projects, not just lectures.
              </p>
              <ul className="feature-list" style={{ margin: '0 0 26px' }}>
                {catalog.tracks.map((item) => (
                  <FeatureLine key={item} label={item} />
                ))}
              </ul>
              <Link to="/learning-programs" className="btn-eduact" style={BOTTOM_CTA}>Explore Courses</Link>
            </GlareHover>
          </div>
        </Container>
      </section>


      <section className="page-section light" id="business" style={{ position: 'relative', overflow: 'hidden', background: '#fff' }}>
        <Container style={{ position: 'relative', zIndex: 1 }}>
          <div className="section-head reveal">
            <div>
              <p className="eyebrow" style={{ color: 'var(--eduact-base)' }}>What we do</p>
              <h2>Work that moves a real metric.</h2>
            </div>
            <p className="desc muted" style={{ color: 'var(--eduact-text)' }}>Every engagement is scoped around a business outcome - not a generic service list.</p>
          </div>

          <div className="reveal">
            <MagicBento
              cards={[
                { color: 'var(--eduact-black)', title: 'Business Solutions', description: 'CRM, marketing, design, software and strategy - scoped around a business outcome.', label: 'For businesses', link: '/business-solutions', linkLabel: 'Explore Business Solutions', metric: { ...metrics.services, unit: 'services' } },
                { color: 'var(--eduact-black)', title: 'Learning Programs', description: 'Industry-linked training across technology, design and analytics - built around real projects.', label: 'For learners', link: '/learning-programs', linkLabel: 'Explore Learning Programs', metric: { ...metrics.tracks, unit: 'career tracks' } },
                { color: 'var(--eduact-black)', title: 'CSR Projects', description: 'Workforce readiness, education access and digital empowerment - delivered through institutional partnerships.', label: 'CSR', link: '/csr-projects', linkLabel: 'View All CSR Projects', metric: { ...metrics.csr, unit: 'projects delivered' } },
                { color: 'var(--eduact-black)', title: 'MOU Directory', description: `${mouCount} memorandums of understanding across software, branding and digital marketing.`, label: 'Partners', link: '/mou-directory', linkLabel: 'View MOU Directory', metric: { ...metrics.mou, unit: 'MoUs signed' } },
              ]}
              textAutoHide={true}
              enableStars={true}
              enableSpotlight={true}
              enableBorderGlow={true}
              enableTilt={true}
              enableMagnetism={true}
              clickEffect={true}
              spotlightRadius={300}
              particleCount={12}
              glowColor="179, 38, 45"
            />
          </div>

          <div className="reveal text-center" style={{ marginTop: '42px' }}>
            <div className="contact-card">
              <span>
                <span className="contact-card__label">Talk to our team</span>
                <span className="contact-card__numbers">
                  {COMPANY.phones.map((phone) => (
                    <a
                      key={phone}
                      href={`tel:${phone.replace(/\s/g, '')}`}
                      className="contact-card__number"
                    >
                      {phone}
                    </a>
                  ))}
                </span>
              </span>
              <span className="contact-card__hint">Every project starts with a scoping call - answered by a real person.</span>
            </div>
          </div>
        </Container>
      </section>

      {/* ========== HOW WE WORK ========== */}
      <section className="page-section dark" style={{ paddingTop: 0 }}>
        <Container>
          <div className="section-head reveal" style={{ marginBottom: '36px' }}>
            <div>
              <p className="eyebrow">How we work</p>
              <h2 style={{ fontSize: '24px' }}>{'Discover -> Analyze -> Strategize -> Implement -> Measure -> Optimize'}</h2>
            </div>
          </div>
          <div className="reveal-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '20px' }}>
            {[
              { n: '01', title: 'Discover', desc: 'Understand the real problem.' },
              { n: '02', title: 'Analyze', desc: 'Map constraints & opportunity.' },
              { n: '03', title: 'Strategize', desc: 'Define the approach.' },
              { n: '04', title: 'Implement', desc: 'Design & build the solution.' },
              { n: '05', title: 'Measure', desc: 'Check it against outcomes.' },
              { n: '06', title: 'Optimize', desc: 'Refine what\'s working.' },
            ].map((step) => (
              <div key={step.n} className="how-we-work-step" style={{ borderTop: '2px solid var(--eduact-secondary)', paddingTop: '16px' }}>
                <span className="step-badge" style={{
                  fontFamily: 'var(--heading-font)',
                  fontWeight: 700,
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.5)',
                  display: 'inline-block',
                  transition: 'transform 0.3s ease, color 0.3s ease',
                  transformOrigin: 'left center',
                  marginBottom: '10px',
                }}>{step.n}</span>
                <h4 style={{ fontSize: '15px', color: '#fff', marginBottom: '6px' }}>{step.title}</h4>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ========== LEARNING PROGRAMS PREVIEW ========== */}
      <section className="page-section" id="learning">
        <Container>
          <div className="section-head reveal">
            <div>
              <p className="eyebrow">Career tracks</p>
              <h2>Skills that move your career forward.</h2>
            </div>
            <p className="desc">Practical, project-based training across technology, design and analytics - grouped by career path.</p>
          </div>

          <Row className="g-0 reveal-stagger" style={{
            background: 'var(--eduact-soft4)',
            border: '1px solid var(--eduact-soft4)',
            borderRadius: '18px',
            overflow: 'hidden',
          }}>
            {[
              { title: 'Data Science & Business Analytics', desc: 'Two focused tracks - Data Science and Business Analytics - for different roles and starting points.' },
              { title: 'Full Stack Development', desc: 'Python or Java-based full stack tracks covering frontend, backend, APIs and deployment.' },
              { title: 'UI/UX Design', desc: 'Research through prototyping, ending in a portfolio built from real projects.' },
              { title: 'Cyber Security & Ethical Hacking', desc: 'Security fundamentals through to hands-on ethical hacking practice.' },
              { title: 'Artificial Intelligence & Machine Learning', desc: 'Python, statistics, ML and deep learning fundamentals through applied projects.' },
              { title: 'Graphic Design, Animation & VFX', desc: 'Design fundamentals through 2D/3D animation and visual effects production.' },
            ].map((card, i) => (
              <Col key={i} xs={12} md={6} lg={4} className="learning-preview-card">
                <GlareHover
                  width="100%"
                  height="100%"
                  background="#fff"
                  borderRadius="0"
                  borderColor="transparent"
                  glareColor="#F4C430"
                  glareOpacity={0.12}
                  glareAngle={-30}
                  glareSize={250}
                  transitionDuration={700}
                  playOnce={false}
                  style={{ display: 'block', padding: '32px 28px' }}
                >
                  <h4>{card.title}</h4>
                  <p>{card.desc}</p>
                  <Link to="/learning-programs" className="card-link">View curriculum {'->'}</Link>
                </GlareHover>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ========== PARTNERS & MoUs ========== */}
      <section className="page-section dark">
        <Container>
          <div className="section-head reveal">
            <div>
              <p className="eyebrow">Trusted through real partnerships</p>
              <h2>Our Partners & MoUs</h2>
            </div>
            <p className="desc muted">Institutional and CSR relationships that back the CSR & training work.</p>
          </div>

          <div className="reveal-stagger" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '2px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '56px',
          }}>
            {statistics.map((stat, i) => (
              <div key={i} className="stat-card">
                <span className="stat-num">
                  {typeof stat.num === 'number'
                    ? <CountUp to={stat.num} separator="," duration={1.5} />
                    : stat.num}
                </span>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>

          <p className="eyebrow" style={{ marginBottom: '18px' }}>Company Partners</p>
          <div className="reveal">
            <div className="marquee-mask">
              <div className="marquee-track">
                {(home.partners || []).concat(home.partners || []).map((p, i) => (
                  <span key={p + i} className="marquee-chip">{p}</span>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ========== CSR PROJECTS PREVIEW ========== */}
      <section className="page-section" id="csr">
        <Container>
          <div className="section-head reveal">
            <div>
              <p className="eyebrow">Corporate Social Responsibility</p>
              <h2>CSR Projects</h2>
            </div>
            <p className="desc">Programs delivered in partnership with our CSR & academic network, by year.</p>
          </div>

          <div className="reveal" style={{ display: 'flex', gap: '10px', marginBottom: '36px' }}>
            {['24-25', '25-26'].map((tab) => (
              <button
                key={tab}
                onClick={() => setCsrTab(tab)}
                style={{
                  padding: '11px 22px',
                  borderRadius: '999px',
                  border: '1px solid var(--eduact-soft4)',
                  fontFamily: 'var(--heading-font)',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  color: csrTab === tab ? '#fff' : 'var(--eduact-text)',
                  background: csrTab === tab ? 'var(--eduact-base)' : 'transparent',
                  borderColor: csrTab === tab ? 'var(--eduact-base)' : 'var(--eduact-soft4)',
                  transition: 'background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease',
                  cursor: 'pointer',
                }}
              >
                20{tab}
              </button>
            ))}
          </div>

          {csrTab === '24-25' && (
            <Row className="g-0 reveal" style={{
              background: 'var(--eduact-soft4)',
              border: '1px solid var(--eduact-soft4)',
              borderRadius: '18px',
              overflow: 'hidden',
            }}>
              {[
                { tag: 'Skill Development', title: 'Workforce readiness training', desc: 'Delivered with EduBridge across partner institutions.' },
                { tag: 'Education Access', title: 'Campus skilling drive', desc: 'Run with Atos Prayas Foundation.' },
                { tag: 'Digital Empowerment', title: 'Community digital literacy', desc: 'Supported by Infosys Foundation CSR collaboration.' },
              ].map((item, i) => (
                <Col key={i} xs={12} md={4}>
                  <div style={{ background: '#fff', padding: '28px 26px' }}>
                    <span style={{
                      fontFamily: 'var(--heading-font)',
                      fontWeight: 600,
                      fontSize: '11px',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--eduact-base)',
                    }}>{item.tag}</span>
                    <h4 style={{ fontSize: '17px', margin: '10px 0 8px' }}>{item.title}</h4>
                    <p style={{ fontSize: '13.5px', color: 'var(--eduact-text)', margin: 0 }}>{item.desc}</p>
                  </div>
                </Col>
              ))}
            </Row>
          )}

          {csrTab === '25-26' && (
            <Row className="g-0 reveal" style={{
              background: 'var(--eduact-soft4)',
              border: '1px solid var(--eduact-soft4)',
              borderRadius: '18px',
              overflow: 'hidden',
            }}>
              {[
                { tag: 'Skill Development', title: 'Advanced workforce training', desc: 'Next-gen skilling programs with industry partners.' },
                { tag: 'Education Access', title: 'Rural digital classrooms', desc: 'Expanding access to quality education in rural Tamil Nadu.' },
                { tag: 'Placements', title: 'Industry connect program', desc: 'Direct placement partnerships with leading tech companies.' },
              ].map((item, i) => (
                <Col key={i} xs={12} md={4}>
                  <div style={{ background: '#fff', padding: '28px 26px' }}>
                    <span style={{
                      fontFamily: 'var(--heading-font)',
                      fontWeight: 600,
                      fontSize: '11px',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--eduact-base)',
                    }}>{item.tag}</span>
                    <h4 style={{ fontSize: '17px', margin: '10px 0 8px' }}>{item.title}</h4>
                    <p style={{ fontSize: '13.5px', color: 'var(--eduact-text)', margin: 0 }}>{item.desc}</p>
                  </div>
                </Col>
              ))}
            </Row>
          )}

          <div className="d-flex flex-wrap justify-content-center mt-4" style={{ gap: '12px' }}>
            <Link to="/csr-projects" className="btn-eduact">View All CSR Projects</Link>
            <Link to="/mou-directory" className="btn-eduact-outline">View MOU Directory</Link>
          </div>
        </Container>
      </section>

      {/* ========== FAQ ========== */}
      <section className="page-section" style={{ paddingTop: 0 }}>
        <Container style={{ maxWidth: '820px' }}>
          <div className="section-head reveal">
            <div>
              <p className="eyebrow">FAQ</p>
              <h2 style={{ fontSize: '26px' }}>Common questions</h2>
            </div>
          </div>

          <div className="reveal">
            <details className="faq-item" open>
              <summary>Do you work with businesses and train individuals at the same time?</summary>
              <p>Yes - Business Solutions and Learning are two divisions of the same organization, run to the same standard.</p>
            </details>
            <details className="faq-item">
              <summary>Where are you based?</summary>
              <p>Head office in Coimbatore, branch office in Chennai (Pallavaram). Both business and learning enquiries can reach either office.</p>
            </details>
            <details className="faq-item">
              <summary>How do I see your CSR project history?</summary>
              <p>The CSR Projects section above lists our programs by year - 2024-25 and 2025-26 - with full details added as each project is confirmed.</p>
            </details>
            <details className="faq-item">
              <summary>What is the MOU Directory?</summary>
              <p>Our MOU Directory documents every memorandum of understanding on record - who the partner is, what it can offer students, and our assessment of how strong the collaboration actually is.</p>
            </details>
          </div>
        </Container>
      </section>

      {/* ========== FINAL CTA ========== */}
      <div style={{ background: 'var(--eduact-black)', color: '#fff', padding: '80px 0' }}>
        <Container>
          <div className="section-head reveal" style={{ marginBottom: '28px' }}>
            <div>
              <p className="eyebrow">Get started</p>
              <h2 style={{ fontSize: '28px', color: '#fff' }}>Tell us which path you're on.</h2>
            </div>
          </div>

          <div className="reveal-stagger" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '18px',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '40px', background: 'var(--eduact-black)', transition: 'background 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--eduact-black)'}
            >
              <h3 style={{ fontSize: '22px', color: '#fff', marginBottom: '10px' }}>I need business solutions</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '22px' }}>
                CRM, marketing, design, software, or strategy - tell us the problem and we'll scope it.
              </p>
              <Link to="/contact" className="btn-eduact-secondary">Talk to an Expert</Link>
            </div>
            <div style={{ padding: '40px', background: 'var(--eduact-black)', transition: 'background 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--eduact-black)'}
            >
              <h3 style={{ fontSize: '22px', color: '#fff', marginBottom: '10px' }}>I want to learn</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '22px' }}>
                Explore a career track and see the full curriculum before you commit.
              </p>
              <Link to="/contact" className="btn-eduact-secondary">Request Course Details</Link>
            </div>
          </div>
        </Container>
      </div>

      {/* ========== ABOUT PREVIEW ========== */}
      <section className="page-section dark" style={{ padding: '64px 0' }}>
        <Container className="reveal">
          <div className="d-flex justify-content-between align-items-center gap-4 flex-wrap">
            <div style={{ maxWidth: '560px' }}>
              <p className="eyebrow">About the company</p>
              <h3 style={{ color: '#fff', fontSize: '24px', marginTop: '12px' }}>One Team, two divisions, headquartered in Coimbatore.</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '12px', fontSize: '14.5px' }}>
                Qaroo India Private Limited runs Business Solutions and Learning as two divisions of a single organization - built on real academic and CSR partnerships across Tamil Nadu and beyond.
              </p>
            </div>
            <Link to="/about" className="btn-eduact-outline" style={{ borderColor: 'rgba(255,255,255,0.24)', color: '#fff' }}>
              Read the full story {'->'}
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
