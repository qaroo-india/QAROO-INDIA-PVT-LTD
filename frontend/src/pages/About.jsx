import { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import GlareHover from '../components/GlareHover';
import FeatureLine from '../components/FeatureLine';
import CountUp from '../components/CountUp';
import Seo from '../components/Seo.jsx';
import { contentApi } from '../api/contentApi.js';
import { statsApi } from '../api/statsApi.js';
import { PARTNERS } from '../data/partners.js';
import PageHero from '../components/PageHero';

const DEFAULT_ABOUT = {
  visionTitle: 'To be a catalyst for digital transformation',
  visionBody:
    'Empowering businesses and individuals through innovative software solutions, creative design, and impactful learning experiences. We believe technology should solve real problems and education should lead to real careers.',
  missionTitle: 'Three pillars that drive everything',
  pillars: [
    'Develop cutting-edge software that solves real-world problems with precision and scalability.',
    'Design intuitive and memorable digital experiences that elevate brand identity.',
    'Deliver practical, industry-linked training that turns learners into professionals.',
  ],
  milestones: [
    { title: 'CSR Collaborations', desc: 'Partnered with EduBridge, a leading CSR implementation partner working alongside prestigious organizations such as Infosys Foundation, Atos Prayas Foundation, Capgemini, Standard Chartered, Canara Bank, and others.' },
    { title: '20+ MoUs Signed', desc: 'Strategic alliances with a diverse range of prestigious companies and organizations, empowering us to broaden capabilities and extend our reach across software development, branding, and digital marketing.' },
    { title: 'Honors & Recognition', desc: 'In 2024, Mrs. Suganya Priya Gobinath was honored with the prestigious "Lifetime Achiever" Award by the World Women\'s Association, recognizing outstanding contributions in software development, branding, and digital empowerment.' },
  ],
  partners: PARTNERS,
  stats: [
    { num: 20, label: 'MoUs signed' },
    { num: 12, label: 'CSR projects delivered' },
    { num: 2, label: 'Office locations' },
    { num: 1500, label: 'Students impacted' },
    { num: '95%', label: 'Placement rate' },
  ],
};

export default function About() {
  const [about, setAbout] = useState(DEFAULT_ABOUT);
  // Held apart from the content, which arrives in its own request and used to
  // overwrite these if it happened to land second.
  const [counts, setCounts] = useState({ mou: null, csr: null });

  useEffect(() => {
    let active = true;
    contentApi
      .get('about', { credentials: 'omit' })
      .then((res) => {
        if (active && res?.data?.content?.data) {
          const d = res.data.content.data;
          setAbout({ ...DEFAULT_ABOUT, ...d, pillars: d.pillars || DEFAULT_ABOUT.pillars, milestones: d.milestones || DEFAULT_ABOUT.milestones, partners: d.partners || DEFAULT_ABOUT.partners });
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  // Live counts from the backend - keeps the MoU / CSR totals auto-updating
  // whenever an admin adds or removes a published MOU or CSR project.
  useEffect(() => {
    let active = true;
    statsApi
      .getStats()
      .then((res) => {
        if (!active || !res?.data) return;
        const { mouCount, csrCount } = res.data;
        setCounts({ mou: mouCount, csr: csrCount });
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  // Live counts win over the numbers stored in the content record.
  const stats = (about.stats || DEFAULT_ABOUT.stats).map((stat, i) => {
    if (i === 0 && counts.mou != null) return { ...stat, num: counts.mou };
    if (i === 1 && counts.csr != null) return { ...stat, num: counts.csr };
    return stat;
  });
  // Matched on any leading number, not on the literal "20+": once the count
  // has been written back into the content record the old check stopped
  // matching, and the milestone froze at whatever it was saved with.
  const milestones = (about.milestones || []).map((m) =>
    counts.mou != null && /^\d+\+ MoUs/.test(m.title || '')
      ? { ...m, title: `${counts.mou}+ MoUs Signed` }
      : m
  );

  return (
    <>
      <Seo
        title="About Us - Qaroo India Private Limited | Digital Solutions & Career Training"
        description={`Learn about Qaroo India Private Limited: our vision, mission, milestones and our impact by the numbers - ${stats[0]?.num ?? 20} MoUs signed and ${stats[1]?.num ?? 12} CSR projects delivered.`}
        path="/about"
      />
      {/* Header */}
      <PageHero padding="80px 0 100px">
        <span className="eyebrow">About Us</span>
        <h1 style={{
          fontFamily: 'var(--heading-font)',
          fontWeight: 800,
          color: '#fff',
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          marginTop: '10px',
        }}>Building digital solutions.<br />Building careers.</h1>
      </PageHero>

      <Container className="page-section">
        <Row className="g-5">
          <Col lg={6}>
            <div className="reveal">
              <p className="eyebrow">Our Vision</p>
              <h2 style={{ fontSize: '28px', marginBottom: '16px' }}>{about.visionTitle}</h2>
              <p style={{ color: 'var(--eduact-text)', fontSize: '15px', lineHeight: 1.7 }}>
                {about.visionBody}
              </p>
            </div>
          </Col>
          <Col lg={6}>
            <div className="reveal">
              <p className="eyebrow">Our Mission</p>
              <h2 style={{ fontSize: '28px', marginBottom: '16px' }}>{about.missionTitle}</h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '12px' }}>
                {(about.pillars || []).map((item, i) => (
                  <li key={i}>
                    <GlareHover
                      width="100%"
                      height="auto"
                      background="var(--eduact-soft5)"
                      borderRadius="14px"
                      borderColor="var(--eduact-soft4)"
                      glareColor="#F4C430"
                      glareOpacity={0.15}
                      glareAngle={-30}
                      glareSize={200}
                      transitionDuration={500}
                      playOnce={false}
                    >
                      <FeatureLine as="div" className="feature-line--card" label={item} />
                    </GlareHover>
                  </li>
                ))}
              </ul>
            </div>
          </Col>
        </Row>

        {/* Milestones */}
        <div className="mt-5 pt-5 reveal">
          <p className="eyebrow">Our Milestones</p>
          <h2 style={{ fontSize: '28px', marginBottom: '36px' }}>Key achievements that define our journey</h2>
          <Row className="g-4">
            {milestones.map((m, i) => (
              <Col key={i} md={4}>
                <div className="eduact-card" style={{ height: '100%', borderTop: '3px solid var(--eduact-base)' }}>
                  <h4 style={{ color: 'var(--eduact-base)' }}>{m.title}</h4>
                  <p>{m.desc}</p>
                </div>
              </Col>
            ))}
          </Row>
        </div>

        {/* Our Journey - timeline */}
        <section className="page-section dark" style={{ borderRadius: '32px', marginTop: '64px', padding: '56px 0', overflow: 'hidden' }}>
          <Container>
            <Row className="g-5">
              <Col lg={5}>
                <div className="reveal">
                  <p className="eyebrow">Our Journey</p>
                  <h2 style={{ fontSize: '28px', color: '#fff', marginBottom: '14px' }}>From one office to a growing national network.</h2>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px' }}>
                    Every milestone has been driven by the same conviction: technology should solve real problems, and education should lead to real careers.
                  </p>
                </div>
              </Col>
              <Col lg={7}>
                <div className="reveal-stagger">
                  {[
                    {
                      year: '2024',
                      title: 'Recognition for impact',
                      desc: 'Mrs. Suganya Priya Gobinath was honored with the "Lifetime Achiever" Award by the World Women\'s Association for outstanding contributions in software development, branding and digital empowerment.',
                    },
                    {
                      year: '2025',
                      title: 'The MoU network grows',
                      desc: 'Strategic alliances with prestigious companies and universities across software development, branding and digital marketing - widening the opportunities reachable to learners.',
                    },
                    {
                      year: '2026',
                      title: 'Twin offices, one standard',
                      desc: 'A head office in Coimbatore and a branch office in Chennai run Business Solutions and Learning as two divisions of a single organization, to the same standard.',
                    },
                  ].map((item, i) => (
                    <div key={i} className="journey-item">
                      <span className="journey-dot" />
                      <span className="journey-year">{item.year}</span>
                      <h4 style={{ color: '#fff' }}>{item.title}</h4>
                      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', margin: 0 }}>{item.desc}</p>
                    </div>
                  ))}
                </div>
              </Col>
            </Row>
          </Container>
        </section>

        {/* Prestigious Partners */}
        <div className="mt-5 pt-5 reveal">
          <p className="eyebrow">Our Prestigious Partners</p>
          <h2 style={{ fontSize: '28px', marginBottom: '36px' }}>Organizations that trust us</h2>

          <Row className="g-4">
            {about.partners.map((p, i) => (
              <Col key={i} md={6} lg={3}>
                <div className="eduact-card" style={{ height: '100%', textAlign: 'center' }}>
                  {p.image ? (
                    <div style={{
                      height: '70px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px',
                      background: '#fff',
                      borderRadius: '10px',
                      border: '1px solid var(--eduact-soft4)',
                      padding: '8px 10px',
                    }}>
                      <img src={p.image} alt={p.name} style={{ maxHeight: '56px', maxWidth: '100%', objectFit: 'contain' }} />
                    </div>
                  ) : (
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: 'var(--eduact-base)',
                      color: '#fff',
                      fontFamily: 'var(--heading-font)',
                      fontWeight: 800,
                      fontSize: '1.2rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px',
                    }}>{p.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</div>
                  )}
                  <h4 style={{ fontSize: '16px' }}>{p.name}</h4>
                  <p style={{ fontSize: '13px' }}>{p.desc}</p>
                </div>
              </Col>
            ))}
          </Row>
        </div>

        {/* Stats */}
        <div className="mt-5 pt-5 reveal">
          <p className="eyebrow">By the Numbers</p>
          <h2 style={{ fontSize: '28px', marginBottom: '36px' }}>Our impact in figures</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2px',
            background: 'var(--eduact-soft4)',
            border: '1px solid var(--eduact-soft4)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}>
            {stats.map((stat, i) => {
              const raw = stat.num;
              const numeric = typeof raw === 'number' ? raw : Number(String(raw).replace(/,/g, ''));
              const isNum = Number.isFinite(numeric);
              return (
                <div key={i} className="stat-card">
                  <span className="stat-num">{isNum ? <CountUp to={numeric} separator="," duration={1.5} /> : raw}</span>
                  <div className="stat-label">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </>
  );
}
