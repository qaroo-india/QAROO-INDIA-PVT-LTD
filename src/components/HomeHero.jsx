import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import WebThreads from './WebThreads';
import AtomField from './AtomField';
import Icon from './Icon';
import useMediaQuery from '../hooks/useMediaQuery';
import './HomeHero.css';

/**
 * Home hero. Copy, links and the network diagram come straight from the page
 * data - this component owns layout, the red gradient stage and the background
 * atoms only.
 */

// Curated icons for the trust strip: each one states what its line is about
// (offices, institutional partnerships, signed agreements).
const STRIP_ICONS = ['map-pin', 'landmark', 'file-check'];

// The two branch paths of the network diagram. Declared once and shared by the
// drawn wire and by the travelling pulse (fed to CSS `offset-path` through a
// custom property), so the curve can never drift between the two.
const BRANCH_BUSINESS = 'M60 170 C 60 220, 300 210, 380 280';
const BRANCH_LEARNING = 'M478 196 C 384 300, 236 268, 120 320';

export default function HomeHero({
  heroEyebrow,
  heroTitle,
  heroDescription,
  buttons = [],
  mouCount,
}) {
  const stageRef = useRef(null);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const compact = useMediaQuery('(max-width: 767px)');

  const stripItems = [
    <>
      <strong>Coimbatore HQ</strong> + <strong>Chennai branch office</strong>
    </>,
    <>
      Academic &amp; CSR partnerships incl. <strong>Infosys Foundation</strong>,{' '}
      <strong>EduBridge</strong>, <strong>Atos Prayas Foundation</strong>
    </>,
    <>
      <span className="qhero__strip-num">{mouCount}</span> MoUs across software, branding &amp;
      digital marketing
    </>,
  ];

  return (
    <section className="qhero">
      <div className="qhero__stage" ref={stageRef}>
        <div className="qhero__bg" aria-hidden="true">
          <span className="qhero__wash red-stage" />
          {!reducedMotion && !compact && (
            <div className="qhero__rays">
              {/* Rays follow the reference art: a hair-thin core inside a warm
                  bloom, the fan converging on the centre of the hero, and few
                  slow wisps rather than a dense fan. strokeWidth is the core in CSS px - 0.6 lands on about
                  one device pixel, the thinnest a line can draw without
                  shimmering. glow has to stay low or the bloom saturates wider
                  than the core and the hairline is lost inside it: at 0.00056
                  the bloom peaks at ~24% just off the core. */}
              <WebThreads
                /* Emission ramp, not per-thread hues: vibrant red in the
                   tails, gold through the mid-range, white at the core. */
                color1="#FF2E14"
                color2="#FFC83A"
                color3="#FFFFFF"
                speed={0.12}
                threadCount={7}
                frequency={2}
                /* Detail: each thread takes its own frequency, and a shorter
                   secondary wave weaves into the path so the arcs read as
                   filaments rather than as a stack of identical sines.
                   scatter randomises every thread's phase, frequency, drift
                   speed and amplitude; fade gives each one its own arrival and
                   departure cycle, so a few wisps drift through at a time
                   rather than five permanent lines. */
                freqSpread={0.16}
                detail={0.22}
                scatter={0.85}
                fade={11}
                /* Each ray tapers along its own length - full where it enters,
                   fully gone by the far edge, so nothing runs edge to edge at
                   an even weight and nothing clips against either edge. */
                lengthFade={1}
                spread={0.22}
                taper={0.5}
                /* Convergence point, in fractions of the ray layer: dead centre
                   of the hero on both axes. The layer's insets are symmetric,
                   so 0.5/0.5 is the stage centre. */
                position={0.5}
                pinch={0.5}
                glow={0.0011}
                falloff={1.25}
                thickness={0.35}
                strokeWidth={0.6}
                brightness={1.15}
                opacity={0.95}
                mirror={true}
                shimmer={false}
                grain={true}
                grainIntensity={0.02}
                mouseInteraction={true}
                mouseStrength={0.18}
                interactionRef={stageRef}
              />
            </div>
          )}
          <AtomField className="qhero__atoms" interactionRef={stageRef} />
          <span className="qhero__vignette" />
        </div>

        <Container className="qhero__inner">
          <Row className="align-items-center g-4 g-lg-5">
            <Col lg={7} xl={6}>
              <p className="eyebrow qhero__eyebrow">{heroEyebrow}</p>
              <h1 className="qhero__title">{heroTitle}</h1>
              <p className="qhero__lead">{heroDescription}</p>
              <div className="qhero__actions">
                {buttons.map((b) => (
                  <Link
                    key={b.link + b.text}
                    to={b.link}
                    className={`qhero__btn ${b.style === 'yellow' ? 'qhero__btn--gold' : 'qhero__btn--ghost'}`}
                  >
                    {b.text}
                    <Icon name="arrow-right" size={17} strokeWidth={2} />
                  </Link>
                ))}
              </div>
            </Col>

            <Col lg={5} xl={6} className="d-none d-lg-block">
              <div className="qhero__diagram">
                <svg viewBox="0 0 480 420" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <radialGradient id="qhero-node-gold">
                      <stop offset="0%" stopColor="#F4C430" stopOpacity="0.55" />
                      <stop offset="55%" stopColor="#F4C430" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#F4C430" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="qhero-node-light">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
                      <stop offset="55%" stopColor="#ffffff" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  <circle cx="60" cy="40" r="20" fill="url(#qhero-node-light)" />
                  <circle className="qhero__halo qhero__halo--a" cx="60" cy="40" r="9" fill="#F3F5F9" />
                  <circle cx="60" cy="40" r="5" fill="#F3F5F9" />
                  <text x="80" y="45" fill="rgba(255,255,255,0.78)" fontFamily="Urbanist, sans-serif" fontSize="12" fontWeight="600" letterSpacing="0.06em">QAROO INDIA PRIVATE LIMITED</text>

                  <path className="qhero__wire" pathLength="1" d="M60 55 C 60 140, 60 140, 60 170" stroke="rgba(255,255,255,0.38)" strokeWidth="1.5" fill="none" />
                  <path className="qhero__wire qhero__wire--b" pathLength="1" d={BRANCH_BUSINESS} stroke="#FFD450" strokeWidth="1.8" fill="none" />
                  <path className="qhero__wire qhero__wire--c" pathLength="1" d={BRANCH_LEARNING} stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1.6" fill="none" />

                  <circle cx="60" cy="170" r="4" fill="#F3F5F9" />
                  <circle cx="380" cy="280" r="26" fill="url(#qhero-node-gold)" />
                  <circle className="qhero__halo qhero__halo--b" cx="380" cy="280" r="10" fill="#F4C430" />
                  <circle cx="380" cy="280" r="5" fill="#FFD450" />
                  <circle cx="120" cy="320" r="24" fill="url(#qhero-node-gold)" />
                  <circle className="qhero__halo qhero__halo--c" cx="120" cy="320" r="10" fill="rgba(244, 196, 48,0.7)" />
                  <circle cx="120" cy="320" r="5" fill="rgba(255, 212, 80,0.92)" />

                  {!reducedMotion && (
                    <>
                      <circle
                        className="qhero__pulse qhero__pulse--b"
                        style={{ '--qhero-branch': `path("${BRANCH_BUSINESS}")` }}
                        cx="0"
                        cy="0"
                        r="3"
                        fill="#ffffff"
                      />
                      <circle
                        className="qhero__pulse qhero__pulse--c"
                        style={{ '--qhero-branch': `path("${BRANCH_LEARNING}")` }}
                        cx="0"
                        cy="0"
                        r="2.6"
                        fill="#FFD450"
                      />
                    </>
                  )}

                  <text className="qhero__node-label" x="392" y="284" fill="#FFD450" fontFamily="Urbanist, sans-serif" fontSize="12" fontWeight="600">BUSINESS</text>
                  <text x="392" y="300" fill="rgba(255,255,255,0.62)" fontFamily="Urbanist, sans-serif" fontSize="11">strategy - design - tech</text>
                  <text className="qhero__node-label" x="10" y="340" fill="#FFD450" fontFamily="Urbanist, sans-serif" fontSize="12" fontWeight="600">LEARNING</text>
                  <text x="10" y="356" fill="rgba(255,255,255,0.62)" fontFamily="Urbanist, sans-serif" fontSize="11">skills - projects - career</text>
                </svg>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <div className="qhero__strip">
        <Container>
          <ul className="qhero__strip-list">
            {stripItems.map((item, i) => (
              <li key={STRIP_ICONS[i]} className="qhero__strip-item">
                <span className={`qhero__strip-ico${i === 2 ? ' is-secure' : ''}`}>
                  <Icon name={STRIP_ICONS[i]} size={19} />
                </span>
                <span className="qhero__strip-text">{item}</span>
              </li>
            ))}
          </ul>
        </Container>
      </div>
    </section>
  );
}
