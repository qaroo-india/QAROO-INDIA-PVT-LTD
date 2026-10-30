import { useState } from 'react';
import { Container, Row, Col, Accordion, Breadcrumb } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Seo from '../../components/Seo.jsx';
import LinedSection from '../../components/LinedSection.jsx';
import PageBackdrop from '../../components/PageBackdrop.jsx';
import BrochureGate from '../../components/BrochureGate';
import { COMPANY } from '../../data/company.js';
import PageHero from '../../components/PageHero';
import './BusinessSolutionTemplate.css';

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
        <span key={item} className="st-chip">
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
            <span className="st-tick">✓</span>
            <span>{item}</span>
          </div>
        </Col>
      ))}
    </Row>
  );
}

/** Numbered cards, matching the key-highlight cards on a programme page. */
function HighlightList({ items }) {
  return (
    <Row className="g-3">
      {items.map((item, i) => (
        <Col xs={12} md={6} lg={4} key={item}>
          <div className="st-highlight">
            <span className="st-medal">{String(i + 1).padStart(2, '0')}</span>
            {item}
          </div>
        </Col>
      ))}
    </Row>
  );
}

/** A section on the soft tint, no backdrop. */
function SoftSection({ children, narrow }) {
  return (
    <section className="page-section" style={{ background: 'var(--eduact-soft2)' }}>
      <Container style={narrow ? { maxWidth: '860px' } : undefined}>{children}</Container>
    </section>
  );
}

/** The paired two-column block this page uses repeatedly. */
function TwoUp({ left, right }) {
  return (
    <Row className="g-5">
      <Col md={6}>
        <p className="eyebrow">{left.eyebrow}</p>
        <h3 className="st-title" style={{ fontSize: '24px', color: 'var(--eduact-black)', marginBottom: '18px' }}>{left.title}</h3>
        <CheckList items={left.items} cols={1} />
      </Col>
      <Col md={6}>
        <p className="eyebrow">{right.eyebrow}</p>
        <h3 className="st-title" style={{ fontSize: '24px', color: 'var(--eduact-black)', marginBottom: '18px' }}>{right.title}</h3>
        <CheckList items={right.items} cols={1} />
      </Col>
    </Row>
  );
}

export default function BusinessSolutionTemplate({ solution, otherSolutions }) {
  const path = `/business-solutions/${solution.slug}`;
  // The proposal is handed over only after the visitor has said who they are,
  // so the button opens the form rather than the document.
  const [brochureOpen, setBrochureOpen] = useState(false);

  const sections = [
    { heading: 'Key services', items: solution.services },
    { heading: 'Business problems we solve', items: solution.problems },
    { heading: 'How we solve them', items: solution.solutions },
    { heading: 'What you get', items: solution.features },
    { heading: 'Why it matters', items: solution.benefits },
    { heading: 'Technologies & tools', items: solution.techniques },
    {
      heading: 'Our process',
      items: (solution.process || []).map((p) => `${p.title}: ${(p.items || []).join(', ')}`),
    },
    { heading: 'Common use cases', items: solution.useCases },
    { heading: 'Industries we serve', items: solution.industries },
    { heading: 'Who we work with', items: solution.audience },
    { heading: 'Why choose this solution', items: solution.whyChoose },
  ];

  return (
    <div className="solution-template">
      <PageBackdrop />

      <Seo
        title={solution.metaTitle}
        description={solution.metaDescription}
        path={path}
      />

      {/* Hero - the shared band, with the gold rule, corner glow and foot
          falloff the programme hero carries. */}
      <PageHero padding="56px 0 88px">
        <Breadcrumb style={{ marginBottom: '14px' }}>
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }} style={{ color: 'rgba(255,255,255,0.6)' }}>
            Home
          </Breadcrumb.Item>
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/business-solutions' }} style={{ color: 'rgba(255,255,255,0.6)' }}>
            Business Solutions
          </Breadcrumb.Item>
          <Breadcrumb.Item active style={{ color: '#fff' }}>
            {solution.pageName}
          </Breadcrumb.Item>
        </Breadcrumb>
        <span className="eyebrow">Business Solution</span>
        <h1 style={{
          fontFamily: 'var(--heading-font)',
          fontWeight: 800,
          color: '#fff',
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          marginTop: '10px',
        }}>{solution.pageName}</h1>
        <p style={{ color: 'rgba(255,255,255,0.75)', maxWidth: '640px', marginTop: '14px', fontSize: '16px' }}>
          {solution.shortDescription}
        </p>
        <div style={{ marginTop: '22px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link to="/contact" className="btn-eduact" style={{ background: 'var(--eduact-secondary)', color: 'var(--eduact-black)' }}>
            Discuss Your Project
          </Link>
          <button
            type="button"
            onClick={() => setBrochureOpen(true)}
            className="btn-eduact-outline"
            style={{ color: '#fff', borderColor: '#F4C430', cursor: 'pointer' }}
          >
            Download Brochure
          </button>
          <Link to="/business-solutions" className="btn-eduact-outline" style={{ color: '#fff' }}>
            View All Solutions
          </Link>
        </div>
      </PageHero>

      {/* Overview + key services */}
      <LinedSection>
        <div className="reveal" style={{ maxWidth: '860px' }}>
          <p className="eyebrow">Overview</p>
          <h2 className="st-title" style={{ fontSize: 'clamp(26px, 3vw, 36px)', color: 'var(--eduact-black)', marginBottom: '20px' }}>
            {solution.pageName} from Qaroo India
          </h2>
          {solution.fullDescription.split('\n\n').map((para, i) => (
            <p key={i} style={{ fontSize: '15.5px', lineHeight: 1.8, color: 'var(--eduact-text)', marginBottom: '16px' }}>
              {para}
            </p>
          ))}
        </div>

        <div className="mt-5 reveal">
          <p className="eyebrow">What We Do</p>
          <h3 className="st-title" style={{ fontSize: '26px', color: 'var(--eduact-black)', marginBottom: '18px' }}>
            Key services
          </h3>
          <HighlightList items={solution.services} />
        </div>
      </LinedSection>

      {/* The challenge + our approach */}
      <SoftSection>
        <TwoUp
          left={{ eyebrow: 'The Challenge', title: 'Business problems we solve', items: solution.problems }}
          right={{ eyebrow: 'Our Approach', title: 'How we solve them', items: solution.solutions }}
        />
      </SoftSection>

      {/* Features + benefits */}
      <LinedSection>
        <TwoUp
          left={{ eyebrow: 'Features', title: 'What you get', items: solution.features }}
          right={{ eyebrow: 'Benefits', title: 'Why it matters', items: solution.benefits }}
        />
      </LinedSection>

      {/* Toolkit */}
      <SoftSection>
        <SectionTitle eyebrow="Toolkit" title="Technologies & tools" />
        <ChipList items={solution.techniques} />
      </SoftSection>

      {/* Process */}
      <LinedSection>
        <SectionTitle
          eyebrow="How We Work"
          title="Our process"
          desc="A clear, practical process from first conversation to measurable results."
        />
        <Row className="g-4">
          {solution.process.map((mod, i) => (
            <Col md={6} lg={3} key={mod.title}>
              <div className="eduact-card reveal" style={{ height: '100%' }}>
                <span className="idx">Step {String(i + 1).padStart(2, '0')}</span>
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
      </LinedSection>

      {/* Use cases + industries */}
      <SoftSection>
        <TwoUp
          left={{ eyebrow: 'Where It Applies', title: 'Common use cases', items: solution.useCases }}
          right={{ eyebrow: 'Industries', title: 'Industries we serve', items: solution.industries }}
        />
      </SoftSection>

      {/* Audience + why choose */}
      <LinedSection>
        <TwoUp
          left={{ eyebrow: 'Who It Is For', title: 'Who we work with', items: solution.audience }}
          right={{ eyebrow: 'Why Us', title: 'Why choose this solution', items: solution.whyChoose }}
        />
      </LinedSection>

      {/* FAQ */}
      <SoftSection narrow>
        <SectionTitle eyebrow="FAQ" title="Frequently asked questions" />
        <Accordion defaultActiveKey="0" style={{ borderRadius: '14px', overflow: 'hidden' }}>
          {solution.faq.map((f, i) => (
            <Accordion.Item eventKey={String(i)} key={f.q}>
              <Accordion.Header>{f.q}</Accordion.Header>
              <Accordion.Body style={{ fontSize: '14.5px', color: 'var(--eduact-text)' }}>
                {f.a}
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      </SoftSection>

      {/* Other solutions */}
      {otherSolutions && otherSolutions.length > 0 && (
        <LinedSection>
          <SectionTitle eyebrow="Explore More" title="Other business solutions" />
          <Row className="g-4">
            {otherSolutions.map((s) => (
              <Col md={6} lg={4} key={s.slug}>
                <div className="eduact-card reveal" style={{ height: '100%' }}>
                  <h3>{s.pageName}</h3>
                  <p>{s.shortDescription}</p>
                  <Link to={`/business-solutions/${s.slug}`} className="card-link">View solution {'->'}</Link>
                </div>
              </Col>
            ))}
          </Row>
        </LinedSection>
      )}

      {/* CTA */}
      <section className="page-section st-cta">
        <Container className="text-center">
          <h2 style={{ fontFamily: 'var(--heading-font)', fontWeight: 800, color: '#fff', fontSize: 'clamp(24px, 3vw, 34px)' }}>
            Ready to get started with {solution.pageName}?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', maxWidth: '520px', margin: '14px auto 26px' }}>
            Talk to our team about how we can help. Call {COMPANY.primaryPhone} or send an enquiry.
          </p>
          <Link to="/contact" className="btn-eduact" style={{ background: 'var(--eduact-secondary)', color: 'var(--eduact-black)' }}>
            Get in Touch
          </Link>
        </Container>
      </section>

      <BrochureGate
        show={brochureOpen}
        onHide={() => setBrochureOpen(false)}
        title={solution.pageName}
        slug={solution.slug}
        group="business"
        href={solution.brochure}
        subtitle={solution.shortDescription}
        sections={sections}
      />
    </div>
  );
}
