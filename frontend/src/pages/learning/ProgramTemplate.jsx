import { useState } from 'react';
import { Container, Row, Col, Accordion, Breadcrumb } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Seo from '../../components/Seo.jsx';
import InkLines from '../../components/InkLines.jsx';
import GradientBlobBackground from '../../components/GradientBlobBackground.jsx';
import { COMPANY } from '../../data/company.js';
import BrochureGate from '../../components/BrochureGate';
import './ProgramTemplate.css';

const BLOB_COLORS = ['#172A46', '#B3262D', '#F4C430'];

function SectionTitle({ eyebrow, title, desc }) {
  return (
    <div className="section-head reveal">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {desc && <p className="desc">{desc}</p>}
    </div>
  );
}

function ChipList({ items }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {items.map((item) => (
        <span key={item} className="lt-chip">
          {item}
        </span>
      ))}
    </div>
  );
}

function CheckList({ items, cols = 2 }) {
  return (
    <Row>
      {items.map((item) => (
        <Col key={item} xs={12} md={6} lg={cols === 3 ? 4 : 6} style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14.5px', color: 'var(--eduact-text)' }}>
            <span className="lt-tick">✓</span>
            <span>{item}</span>
          </div>
        </Col>
      ))}
    </Row>
  );
}

export default function ProgramTemplate({ program, otherPrograms }) {
  const path = `/learning-programs/${program.slug}`;
  // The brochure is handed over only after the visitor has told us who they
  // are, so the button opens the form rather than the document.
  const [brochureOpen, setBrochureOpen] = useState(false);

  const sections = [
    { heading: 'Key highlights', items: program.highlights },
    { heading: 'What you will learn', items: program.learn },
    { heading: 'Tools & technologies', items: program.tools },
    {
      heading: 'Course modules',
      items: (program.modules || []).map((m) => `${m.title}: ${(m.items || []).join(', ')}`),
    },
    { heading: 'Career opportunities', items: program.careers },
    { heading: 'Who can join', items: program.audience },
    { heading: 'Course benefits', items: program.benefits },
    { heading: 'Learning modes', items: program.modes },
  ];

  return (
    <div className="learning-template">
      <div className="lt-blobs" aria-hidden="true">
        <GradientBlobBackground colors={BLOB_COLORS} opacity={0.16} />
      </div>
      <Seo
        title={program.metaTitle}
        description={program.metaDescription}
        path={path}
      />

      {/* Hero */}
      <div className="lt-hero red-stage" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="lt-ring2" />
        <Container style={{ position: 'relative', zIndex: 2 }}>
          <Breadcrumb style={{ marginBottom: '14px' }}>
            <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }} style={{ color: 'rgba(255,255,255,0.6)' }}>
              Home
            </Breadcrumb.Item>
            <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/learning-programs' }} style={{ color: 'rgba(255,255,255,0.6)' }}>
              Learning Programs
            </Breadcrumb.Item>
            <Breadcrumb.Item active style={{ color: '#fff' }}>
              {program.pageName}
            </Breadcrumb.Item>
          </Breadcrumb>
          <span className="eyebrow">Learning Program</span>
          <h1 style={{
            fontFamily: 'var(--heading-font)',
            fontWeight: 800,
            color: '#fff',
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            marginTop: '10px',
          }}>{program.pageName}</h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', maxWidth: '640px', marginTop: '14px', fontSize: '16px' }}>
            {program.shortDescription}
          </p>
          <div style={{ marginTop: '22px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link to="/contact" className="btn-eduact" style={{ background: 'var(--eduact-secondary)', color: 'var(--eduact-black)' }}>
              Request Course Details
            </Link>
            <button
              type="button"
              onClick={() => setBrochureOpen(true)}
              className="btn-eduact-outline"
              style={{ color: '#fff', borderColor: '#F4C430', cursor: 'pointer' }}
            >
              Download Brochure
            </button>
            <Link to="/learning-programs" className="btn-eduact-outline" style={{ color: '#fff' }}>
              View All Programs
            </Link>
          </div>
        </Container>
      </div>

      {/* Introduction (section 2 - ink lines) */}
      <section className="page-section lt-lines" style={{ position: 'relative', overflow: 'hidden' }}>
        <InkLines mode="light" />
        <Container style={{ position: 'relative', zIndex: 1 }}>
          <div className="reveal" style={{ maxWidth: '860px' }}>
            <p className="eyebrow">Program Overview</p>
            <h2 className="lt-title" style={{ fontSize: 'clamp(26px, 3vw, 36px)', color: 'var(--eduact-black)', marginBottom: '20px' }}>
              Why learn {program.pageName}?
            </h2>
            {program.fullDescription.split('\n\n').map((para, i) => (
              <p key={i} style={{ fontSize: '15.5px', lineHeight: 1.8, color: 'var(--eduact-text)', marginBottom: '16px' }}>
                {para}
              </p>
            ))}
          </div>

          {/* Key Highlights */}
          <div className="mt-5 reveal">
            <p className="eyebrow">Key Highlights</p>
            <h3 className="lt-title" style={{ fontSize: '26px', color: 'var(--eduact-black)', marginBottom: '18px' }}>What makes this program valuable</h3>
            <Row className="g-3">
              {program.highlights.map((h, i) => (
                <Col xs={12} md={6} lg={4} key={h}>
                  <div className="lt-highlight">
                    <span className="lt-medal">{String(i + 1).padStart(2, '0')}</span>
                    {h}
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        </Container>
      </section>

      {/* What You Will Learn */}
      <section className="page-section" style={{ background: 'var(--eduact-soft2)' }}>
        <Container>
          <SectionTitle
            eyebrow="Curriculum"
            title="What you will learn"
            desc="A practical, industry-oriented curriculum designed to build job-ready skills step by step."
          />
          <div className="eduact-card reveal">
            <CheckList items={program.learn} cols={2} />
          </div>
        </Container>
      </section>

      {/* Tools & Technologies (section 4 - ink lines) */}
      <section className="page-section lt-lines" style={{ position: 'relative', overflow: 'hidden' }}>
        <InkLines mode="light" />
        <Container style={{ position: 'relative', zIndex: 1 }}>
          <SectionTitle eyebrow="Toolkit" title="Tools & technologies" />
          <ChipList items={program.tools} />
        </Container>
      </section>

      {/* Course Modules */}
      <section className="page-section" style={{ background: 'var(--eduact-soft2)' }}>
        <Container>
          <SectionTitle
            eyebrow="Course Structure"
            title="Course modules"
            desc="Structured modules take you from fundamentals to advanced, project-based application."
          />
          <Row className="g-4">
            {program.modules.map((mod, i) => (
              <Col md={6} lg={4} key={mod.title}>
                <div className="eduact-card reveal">
                  <span className="idx">Module {String(i + 1).padStart(2, '0')}</span>
                  <h3>{mod.title}</h3>
                  <ul style={{ paddingLeft: '18px', margin: 0, listStyle: 'disc' }}>
                    {mod.items.map((item) => (
                      <li key={item} style={{ fontSize: '13.5px', color: 'var(--eduact-text)', marginBottom: '5px' }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Career Opportunities (section 6 - ink lines) */}
      <section className="page-section lt-lines" style={{ position: 'relative', overflow: 'hidden' }}>
        <InkLines mode="light" />
        <Container style={{ position: 'relative', zIndex: 1 }}>
          <SectionTitle
            eyebrow="Career Paths"
            title="Career opportunities"
            desc="Graduates of this program can pursue a range of in-demand roles."
          />
          <div className="eduact-card reveal">
            <ChipList items={program.careers} />
          </div>
        </Container>
      </section>

      {/* Who Can Join + Benefits */}
      <section className="page-section" style={{ background: 'var(--eduact-soft2)' }}>
        <Container>
          <Row className="g-5">
            <Col md={6}>
              <p className="eyebrow">Who can join</p>
              <h3 className="lt-title" style={{ fontSize: '24px', color: 'var(--eduact-black)', marginBottom: '18px' }}>Is this program right for you?</h3>
              <CheckList items={program.audience} cols={1} />
            </Col>
            <Col md={6}>
              <p className="eyebrow">Course benefits</p>
              <h3 className="lt-title" style={{ fontSize: '24px', color: 'var(--eduact-black)', marginBottom: '18px' }}>What you gain</h3>
              <CheckList items={program.benefits} cols={1} />
            </Col>
          </Row>
        </Container>
      </section>

      {/* Certification + Placement + Learning Modes */}
      <section className="page-section">
        <Container>
          <Row className="g-4">
            <Col md={6} lg={4}>
              <div className="eduact-card reveal" style={{ height: '100%' }}>
                <span className="idx">Certification</span>
                <h3>Get certified</h3>
                <p>{program.certification}</p>
              </div>
            </Col>
            <Col md={6} lg={4}>
              <div className="eduact-card reveal" style={{ height: '100%' }}>
                <span className="idx">Career Support</span>
                <h3>Placement support</h3>
                <p>{program.placement}</p>
              </div>
            </Col>
            <Col md={12} lg={4}>
              <div className="eduact-card reveal" style={{ height: '100%' }}>
                <span className="idx">Flexibility</span>
                <h3>Learning modes</h3>
                <ChipList items={program.modes} />
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* FAQ */}
      <section className="page-section" style={{ background: 'var(--eduact-soft2)' }}>
        <Container style={{ maxWidth: '860px' }}>
          <SectionTitle eyebrow="FAQ" title="Frequently asked questions" />
          <Accordion defaultActiveKey="0" style={{ borderRadius: '14px', overflow: 'hidden' }}>
            {program.faq.map((f, i) => (
              <Accordion.Item eventKey={String(i)} key={f.q}>
                <Accordion.Header>{f.q}</Accordion.Header>
                <Accordion.Body style={{ fontSize: '14.5px', color: 'var(--eduact-text)' }}>
                  {f.a}
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        </Container>
      </section>

      {/* Other programs */}
      {otherPrograms && otherPrograms.length > 0 && (
        <section className="page-section lt-lines" style={{ position: 'relative', overflow: 'hidden' }}>
          <InkLines mode="light" />
          <Container style={{ position: 'relative', zIndex: 1 }}>
            <SectionTitle eyebrow="Explore more" title="Other learning programs" />
            <Row className="g-4">
              {otherPrograms.map((p) => (
                <Col md={6} lg={4} key={p.slug}>
                  <div className="eduact-card reveal" style={{ height: '100%' }}>
                    <h3>{p.pageName}</h3>
                    <p>{p.shortDescription}</p>
                    <Link to={`/learning-programs/${p.slug}`} className="card-link">View program {'->'}</Link>
                  </div>
                </Col>
              ))}
            </Row>
          </Container>
        </section>
      )}

      {/* CTA */}
      <section className="page-section lt-cta">
        <Container className="text-center">
          <h2 style={{ fontFamily: 'var(--heading-font)', fontWeight: 800, color: '#fff', fontSize: 'clamp(24px, 3vw, 34px)' }}>
            Ready to start your journey with {program.pageName}?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', maxWidth: '520px', margin: '14px auto 26px' }}>
            Talk to our career counsellors about curriculum, batch timings and fees. Call {COMPANY.primaryPhone} or send an enquiry.
          </p>
          <Link to="/contact" className="btn-eduact" style={{ background: 'var(--eduact-secondary)', color: 'var(--eduact-black)' }}>
            Enquire Now
          </Link>
        </Container>
      </section>

      <BrochureGate
        show={brochureOpen}
        onHide={() => setBrochureOpen(false)}
        title={program.pageName}
        slug={program.slug}
        group="learning"
        href={program.brochure}
        subtitle={program.shortDescription}
        sections={sections}
      />
    </div>
  );
}
