import { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import ZoomReveal from '../components/ZoomReveal';
import Seo from '../components/Seo.jsx';
import { Shimmer, EmptyState, ErrorState } from '../components/ui/States';
import { csrApi } from '../api/csrApi.js';
import { contentApi } from '../api/contentApi.js';
import { statsApi } from '../api/statsApi.js';
import PageHero from '../components/PageHero';

const DEFAULT_CSR_PAGE = {
  eyebrow: 'Corporate Social Responsibility',
  title: 'CSR Projects',
  description: 'Programs delivered in partnership with our CSR & academic network, creating real impact across Tamil Nadu.',
  mouBannerTitle: 'Explore our Institutional Partnerships',
  mouBannerDesc: 'View all 20+ Memorandums of Understanding with detailed assessments.',
};

export default function CSRProjects() {
  const [activeTab, setActiveTab] = useState('24-25');
  const [projects, setProjects] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [content, setContent] = useState(DEFAULT_CSR_PAGE);
  const [mouCount, setMouCount] = useState(20);
  const aliveRef = useRef(true);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    csrApi
      .list({}, { credentials: 'omit' })
      .then((res) => {
        if (!aliveRef.current) return;
        const grouped = {};
        (res.data.projects || []).forEach((p) => {
          const y = p.year || '24-25';
          if (!grouped[y]) grouped[y] = [];
          grouped[y].push(p);
        });
        setProjects(grouped);
      })
      .catch((err) => {
        if (aliveRef.current) setError(err?.message || 'We could not load the projects. Please try again.');
      })
      .finally(() => { if (aliveRef.current) setLoading(false); });
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    reload();
    contentApi.get('csr', { credentials: 'omit' })
      .then((res) => { if (aliveRef.current) setContent({ ...DEFAULT_CSR_PAGE, ...(res.data?.content?.data || {}) }); })
      .catch(() => {});
    statsApi.getStats()
      .then((res) => { if (aliveRef.current && res?.data?.mouCount != null) setMouCount(res.data.mouCount); })
      .catch(() => {});
    return () => { aliveRef.current = false; };
  }, [reload]);

  // Order tabs deterministically: years present in data
  const years = Object.keys(projects).sort();
  const activeYear = years.includes(activeTab) ? activeTab : (years[0] || '24-25');
  const current = projects[activeYear] || [];
  const hasYears = years.length > 0;

  // Projects are grouped by year, so the hero counts across every group rather
  // than only the tab that happens to be open.
  const totalProjects = years.reduce((sum, year) => sum + (projects[year]?.length || 0), 0);
  const heroFacts = totalProjects
    ? [
        { num: totalProjects, label: totalProjects === 1 ? 'Project' : 'Projects' },
        { num: years.length, label: years.length === 1 ? 'Year' : 'Years' },
      ]
    : [];

  return (
    <>
      <Seo
        title="CSR Projects - Qaroo India Private Limited | Corporate Social Responsibility & Skill Development"
        description="Corporate Social Responsibility projects by Qaroo India Private Limited - workforce readiness, education access and digital empowerment programs delivered in partnership with CSR & academic institutions across Tamil Nadu."
        path="/csr-projects"
      />
      <PageHero padding="80px 0 100px" facts={heroFacts}>
        <span className="eyebrow">{content.eyebrow}</span>
        <h1 style={{
          fontFamily: 'var(--heading-font)',
          fontWeight: 800,
          color: '#fff',
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          marginTop: '10px',
        }}>{content.title}</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '560px', marginTop: '14px' }}>
          {content.description}
        </p>
      </PageHero>

      <Container className="page-section">
        {/* Year Tabs */}
        <div className="reveal" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '36px' }}>
          {(hasYears ? years : ['24-25', '25-26']).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '11px 22px',
                borderRadius: '999px',
                border: '1px solid var(--eduact-soft4)',
                fontFamily: 'var(--heading-font)',
                fontWeight: 600,
                fontSize: '13.5px',
                color: activeYear === tab ? '#fff' : 'var(--eduact-text)',
                background: activeYear === tab ? 'var(--eduact-base)' : 'transparent',
                borderColor: activeYear === tab ? 'var(--eduact-base)' : 'var(--eduact-soft4)',
                transition: 'background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease',
                cursor: 'pointer',
              }}
            >
              20{tab}
            </button>
          ))}
        </div>

        {/* MOU Directory Link */}
        <div className="reveal mb-4" style={{
          background: 'var(--eduact-soft3)',
          borderRadius: '14px',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div>
            <h4 style={{ fontSize: '16px', marginBottom: '4px', color: 'var(--eduact-black)' }}>
              {content.mouBannerTitle}
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--eduact-text)', margin: 0 }}>
              {`View all ${mouCount} Memorandums of Understanding with detailed assessments.`}
            </p>
          </div>
          <Link to="/mou-directory" className="btn-eduact">Open MOU Directory</Link>
        </div>

        {/* Flagship ZoomReveal Cards */}
        <div className="reveal" style={{ marginBottom: '48px' }}>
          <p className="eyebrow">Featured Projects - Click to reveal</p>
          <Row className="g-4" style={{ marginTop: '8px' }}>
            {(loading ? [] : current.slice(0, 3)).map((project, i) => (
              <Col key={i} md={6} lg={4}>
                <ZoomReveal
                  aspectRatio="4 / 3"
                  front={
                    <div style={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: '24px',
                      textAlign: 'center',
                      background: 'var(--eduact-soft5)',
                      borderRadius: '16px',
                    }}>
                      <span style={{
                        fontFamily: 'var(--heading-font)',
                        fontWeight: 600,
                        fontSize: '11px',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--eduact-base)',
                        marginBottom: '10px',
                      }}>{project.tag}</span>
                      <h4 style={{ fontSize: '18px', color: 'var(--eduact-black)', marginBottom: '8px' }}>{project.title}</h4>
                      <p style={{ fontSize: '13px', color: 'var(--eduact-text)', margin: 0 }}>
                        The Challenge
                      </p>
                      <span style={{
                        marginTop: '16px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--eduact-base)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        Click to reveal the impact
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                      </span>
                    </div>
                  }
                  back={
                    <div style={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: '24px',
                      textAlign: 'center',
                      background: 'var(--eduact-base)',
                      color: '#fff',
                      borderRadius: '16px',
                    }}>
                      <h4 style={{ fontSize: '18px', marginBottom: '12px' }}>The Impact</h4>
                      <div style={{ fontSize: '13px', lineHeight: 1.6, maxWidth: '300px' }}>
                        <div style={{ marginBottom: '8px' }}>
                          <strong style={{ color: 'var(--eduact-secondary)' }}>Partner:</strong> {project.partner}
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                          <strong style={{ color: 'var(--eduact-secondary)' }}>Location:</strong> {project.location}
                        </div>
                        <div>
                          <strong style={{ color: 'var(--eduact-secondary)' }}>Beneficiaries:</strong> {project.beneficiaries}
                        </div>
                      </div>
                    </div>
                  }
                />
              </Col>
            ))}
          </Row>
        </div>

        {/* Full Projects Grid */}
        <div className="reveal">
          <p className="eyebrow">All Projects - 20{activeYear}</p>
        </div>
        <Row className="g-4 reveal-stagger">
          {loading ? (
            <div style={{ width: '100%' }}><Shimmer /></div>
          ) : error ? (
            <div style={{ width: '100%' }}><ErrorState title="Couldn't load projects" text={error} onRetry={reload} /></div>
          ) : current.length === 0 ? (
            <div style={{ width: '100%' }}>
              <EmptyState
                title="No projects here yet"
                text="CSR projects for this period will be published here as they launch. Browse the MOU directory to see our partner institutions."
                action={<Link to="/mou-directory" className="btn-eduact">View MOU Directory</Link>}
              />
            </div>
          ) : current.map((project, i) => (
            <Col key={i} md={6} lg={4}>
              <div className="eduact-card" style={{ height: '100%', borderTop: '3px solid var(--eduact-base)' }}>
                <span style={{
                  fontFamily: 'var(--heading-font)',
                  fontWeight: 600,
                  fontSize: '11px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--eduact-base)',
                  display: 'block',
                  marginBottom: '10px',
                }}>{project.tag}</span>
                <h4>{project.title}</h4>
                <p>{project.desc}</p>
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--eduact-soft4)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--eduact-text)', marginBottom: '4px' }}>
                    <strong style={{ color: 'var(--eduact-black)' }}>Partner:</strong> {project.partner}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--eduact-text)', marginBottom: '4px' }}>
                    <strong style={{ color: 'var(--eduact-black)' }}>Location:</strong> {project.location}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--eduact-text)' }}>
                    <strong style={{ color: 'var(--eduact-black)' }}>Beneficiaries:</strong> {project.beneficiaries}
                  </div>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
}
