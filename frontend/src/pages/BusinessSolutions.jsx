import { useState, useEffect, useRef } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import ScrollExpand from '../components/ScrollExpand';
import Seo from '../components/Seo.jsx';
import ArchitecturalFrames from '../components/ArchitecturalFrames.jsx';
import BlueprintSectionTitle from '../components/BlueprintSectionTitle.jsx';
import useMediaQuery from '../hooks/useMediaQuery';
import FlexCarousel from '../components/FlexCarousel/FlexCarousel';
import { renderRoadmapCard } from './business/roadmapCards.js';
import TiltCard from '../components/TiltCard.jsx';
import BrochureGate from '../components/BrochureGate';
import { businessSolutionApi } from '../api/businessSolutionApi.js';
import { BUSINESS_SOLUTIONS } from '../data/businessSolutions.js';
import './business/BusinessSolutions.css';

// Shown until the published list arrives, and if that request fails. Derived
// from the same source the individual solution pages read, so the two cannot
// drift -- this list was hand-copied before and carried only a title and a
// description, which left the roadmap diagrams empty on the first paint.
const DEFAULT_SERVICES = BUSINESS_SOLUTIONS.map((s, i) => ({
  idx: String(i + 1).padStart(2, '0'),
  title: s.pageName,
  desc: s.shortDescription,
  slug: s.slug,
  process: s.process,
  problems: s.problems,
  benefits: s.benefits,
}));

// Body for the generated brochure, used only as a fallback if the published
// overview PDF is missing. Derived from the same source as the cards.
const OVERVIEW_SECTIONS = [
  {
    heading: 'Our business solutions',
    items: BUSINESS_SOLUTIONS.map((s) => `${s.pageName}: ${s.shortDescription}`),
  },
];

/** Guarantees the arrays the roadmap cards read, whatever the source. */
const withRoadmap = (list) =>
  list.map((s) => ({ process: [], problems: [], benefits: [], ...s }));

export default function BusinessSolutions() {
  const [services, setServices] = useState(() => withRoadmap(DEFAULT_SERVICES));
  const [errors, setErrors] = useState('');
  // The overview proposal is handed over only after the visitor has said who
  // they are, the same way each solution's own brochure is.
  const [overviewOpen, setOverviewOpen] = useState(false);

  useEffect(() => {
    let active = true;
    businessSolutionApi
      .list({}, { credentials: 'omit' })
      .then((res) => {
        if (!active) return;
        const list = res?.data?.solutions || [];
        if (list.length) {
          setServices(
            withRoadmap(
              list
                .filter((s) => s.status === 'published')
                .map((s, i) => ({
                  idx: String(i + 1).padStart(2, '0'),
                  title: s.pageName || s.title,
                  desc: s.shortDescription || s.fullDescription,
                  slug: s.slug,
                  // Read by the roadmap cards. Real content per solution, so
                  // each diagram states how that work actually runs rather
                  // than repeating a generic set of stages.
                  process: s.process,
                  problems: s.problems,
                  benefits: s.benefits,
                }))
            )
          );
        }
      })
      .catch(() => { if (active) setErrors('Some content could not be loaded and may be out of date.'); });
    return () => { active = false; };
  }, []);

  // Which card is centred, as the carousel reports it.
  const [activeCard, setActiveCard] = useState(0);
  const navigate = useNavigate();
  // Below this width the WebGL row is dropped for a plain swipe gallery: the
  // lens bends the type as it curves the cards, which is fine at desktop size
  // and unreadable once a card is phone-sized. The same flag switches the card
  // face to its compact layout, so a gallery slide always carries the larger
  // one.
  const compact = useMediaQuery('(max-width: 799px)');

  const active = services[activeCard] || services[0];


  // The cards are painted onto a canvas, which needs a browser, so they are
  // built in an effect rather than during render. Waiting for the font matters:
  // without it the first cards would be drawn in a fallback face and every one
  // would have to be repainted a moment later.
  const [carouselItems, setCarouselItems] = useState([]);

  useEffect(() => {
    let alive = true;
    const paint = () => {
      if (!alive) return;
      setCarouselItems(
        services.map((solution, index) => ({
          src: renderRoadmapCard(solution, index, { compact }),
          // The row is a canvas, so this is all a screen reader gets: it
          // carries the words that are drawn on the card.
          alt: `Stage ${solution.idx}, ${solution.title}. ${solution.desc}`,
          title: solution.title,
        }))
      );
    };
    if (document.fonts?.ready) document.fonts.ready.then(paint).catch(paint);
    else paint();
    return () => {
      alive = false;
    };
  }, [services, compact]);

  // The gallery is a scroll-snap strip, so the slide in view is read off its
  // scroll position rather than reported by a component.
  const trackRef = useRef(null);
  useEffect(() => {
    const track = trackRef.current;
    if (!track || !compact) return undefined;
    let raf = 0;
    const read = () => {
      raf = 0;
      const slide = track.firstElementChild;
      if (!slide) return;
      const step = slide.getBoundingClientRect().width + 14;
      setActiveCard(Math.max(0, Math.round(track.scrollLeft / step)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    read();
    return () => {
      if (raf) cancelAnimationFrame(raf);
      track.removeEventListener('scroll', onScroll);
    };
  }, [compact, carouselItems.length]);

  return (
    <div className="business-template">
      <Seo
        title="Business Solutions - Qaroo India Private Limited | CRM, Marketing, Design, Software, Strategy"
        description="Business solutions from Qaroo India Private Limited: CRM solutions, digital marketing & SEO, graphic design & branding, web & software development, UI/UX design, UX research and business strategy."
        path="/business-solutions"
      />
      {/* ScrollExpand Hero */}
      <ScrollExpand
        src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80"
        alt="Modern office workspace"
        title="Work that moves a real metric."
        scrollHint="Scroll to expand"
        useWindowScroll
        startWidth={42}
        startHeight={58}
        startRadius={24}
        endRadius={0}
          mediaZoom={1.35}
          scrollDistance={1.2}
          holdDistance={0.35}
          smoothing={0.05}
          overlayScrim={0.45}
      >
        <h2 style={{ color: '#fff', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, maxWidth: '600px', textShadow: '0 2px 24px rgba(0,0,0,0.45)' }}>
          Every engagement is scoped around a business outcome - not a generic service list.
        </h2>
      </ScrollExpand>

      <Container className="page-section">
        {errors && (
          <div style={{
            background: 'rgba(244, 196, 48,0.12)',
            border: '1px solid var(--eduact-secondary)',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '13px',
            color: 'var(--eduact-black)',
            marginBottom: '24px',
            textAlign: 'center',
          }}>
            {errors}
          </div>
        )}
        {/* Services navigation */}
        <nav aria-label="Services navigation" style={{ marginBottom: '36px' }}>
          <style>{`
            .services-nav {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
              align-items: center;
              justify-content: center;
            }
            .services-nav-link {
              display: inline-flex;
              alignItems: center;
              gap: 6px;
              font-size: 14px;
              font-weight: 600;
              color: var(--eduact-black);
              background: #fff;
              border: 1px solid var(--eduact-soft4);
              border-radius: 999px;
              padding: 9px 16px;
              box-shadow: 0 4px 12px rgba(23, 42, 70,0.05);
              transition: background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease;
              text-decoration: none;
            }
            .services-nav-link:hover {
              color: #fff;
              background: var(--eduact-base);
              border-color: var(--eduact-base);
              transform: translateY(-2px);
              box-shadow: 0 8px 18px rgba(179, 38, 45,0.25);
            }
            .services-nav-link.is-home {
              color: #fff;
              background: var(--eduact-base);
              border-color: var(--eduact-base);
            }
            .services-nav-link.is-home:hover {
              background: var(--eduact-dark, #7a120e);
              border-color: var(--eduact-dark, #7a120e);
            }
          `}</style>
          <div className="services-nav">
            <Link to="/business-solutions" className="services-nav-link is-home" style={{ textDecoration: 'none' }}>
              Business Solutions
            </Link>
            {services.map((s) => (
                <Link
                  key={s.idx || s.title}
                  to={s.slug ? `/business-solutions/${s.slug}` : '/business-solutions'}
                  className="services-nav-link"
                  style={{ textDecoration: 'none' }}
                >
                  {s.title}
                </Link>
              ))}
          </div>
        </nav>
      </Container>

      {/* Roadmap: the same eight solutions, in the same order. A card is a
          WebGL texture, so each one's words are painted into its image by
          roadmapCards.js rather than written as markup.

          Outside the container on purpose, so the row runs the full width of
          the page. That also takes it out of the z-index lift the container
          has, which is why it is named in that rule in the stylesheet - a
          section left at z-index auto here is painted under .af-blocks. */}
      <div className="solutions-roadmap-band">
          <BlueprintSectionTitle
            eyebrow="Roadmap"
            title="The route through our solutions."
            aside={`${services.length} Stages`}
          />

          {/* A plain swipe gallery under 800px. The WebGL row curves its cards
              through a lens, which bends the type with them - handsome at
              desktop size, illegible once a card is phone-sized. This is an
              ordinary scroll-snap strip: native touch scrolling, no
              distortion, and nothing to fight the page scroll. */}
          {compact ? (
            <div className="rm-gallery">
              <ul className="rm-gallery__track" ref={trackRef}>
                {carouselItems.map((item, index) => {
                  const solution = services[index];
                  return (
                    <li className="rm-gallery__slide" key={item.title}>
                      <Link
                        to={solution?.slug ? `/business-solutions/${solution.slug}` : '/business-solutions'}
                        aria-label={`Open ${item.title}`}
                      >
                        <img src={item.src} alt={item.alt} width="620" height="826" />
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="rm-gallery__dots" aria-hidden="true">
                {carouselItems.map((item, index) => (
                  <span
                    key={item.title}
                    className={`rm-gallery__dot${index === activeCard ? ' is-on' : ''}`}
                  />
                ))}
              </div>

              <p className="rm-gallery__count" aria-live="polite">
                {active
                  ? `Stage ${active.idx} of ${String(services.length).padStart(2, '0')} - ${active.title}`
                  : ''}
              </p>
            </div>
          ) : (
          /* Held back until the cards exist: the carousel falls back to its
             own sample photographs when handed an empty list, and those would
             flash up before the first paint. */
          <div className="rm-row">
            {carouselItems.length > 0 && (
            <FlexCarousel
              items={carouselItems}
              preset="liquid"
              intro="rise"
              fit="portrait"
              /* The card takes almost the whole row on a phone: there is no
                 room for neighbours to be useful at that size, and every
                 pixel given to the centre card is type the reader can see. */
              cardHeight={compact ? 0.94 : 0.84}
              gap={compact ? 10 : 18}
              radius={20}
              squeeze={0.2}
              /* The card carries its own title, so the caption underneath it
                 would only repeat the words already drawn on the face. */
              captions={false}
              /* Clicking the centred card opens that solution. A side card is
                 brought to the centre first, which is the library's own
                 behaviour and reads correctly here. */
              focusOnClick={false}
              onChange={(index) => setActiveCard(index)}
              onSelect={(index) => {
                const chosen = services[index];
                if (chosen?.slug) navigate(`/business-solutions/${chosen.slug}`);
              }}
            />
            )}
          </div>
          )}

        <p className="rm-row__hint">
          {compact
            ? 'Swipe through the stages. Tap a card to open it.'
            : active
              ? `Drag or scroll the row to move through the stages. Click the centred card to open ${active.title}.`
              : 'Drag or scroll the row to move through the stages.'}
        </p>
      </div>

      <Container className="page-section pt-0">
        <BlueprintSectionTitle
          eyebrow="Plan view"
          index="01"
          title="Our Solutions"
          aside="8 Specifications"
        />

        <Row className="g-4 reveal-stagger">
          {services.map((s) => {
            const detailPath = s.slug ? `/business-solutions/${s.slug}` : '/business-solutions';
            return (
            <Col key={s.idx || s.title} md={6} lg={4}>
              <TiltCard>
              <div className="af-card-wrap">
              <Link
                to={detailPath}
                className="eduact-card track-card"
                aria-label={`Open ${s.title} details`}
              >
                <span className="idx">{s.idx} / {s.title.split(' ')[0]}</span>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </Link>
              </div>
              </TiltCard>
            </Col>
            );
          })}
        </Row>

        <div className="mt-5 pt-4 reveal" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <BlueprintSectionTitle
            eyebrow="Ready to start?"
            title="Let's discuss your business challenge."
            align="center"
            aside="Contact"
          />
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to="/contact" className="btn-eduact">Get in Touch</Link>
            <button
              type="button"
              onClick={() => setOverviewOpen(true)}
              className="btn-eduact-outline"
              style={{ cursor: 'pointer' }}
            >
              Download Services Overview
            </button>
          </div>
        </div>
      </Container>
      {/* Architectural background */}
      <div className="af-blocks" aria-hidden="true">
        <ArchitecturalFrames />
      </div>

      <BrochureGate
        show={overviewOpen}
        onHide={() => setOverviewOpen(false)}
        title="Business Solutions Overview"
        slug="all-solutions"
        group="business"
        subtitle="Strategy, design, engineering and marketing delivered by one team."
        sections={OVERVIEW_SECTIONS}
      />
    </div>
  );
}
