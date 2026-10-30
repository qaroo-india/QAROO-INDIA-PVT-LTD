import { useRef } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import AtomField from './AtomField';
import './PageHero.css';

/**
 * Header band for every page except the home page.
 *
 * The home hero fills its width with its thread field and the globe. Every
 * other hero was a single column of text on the same wide red stage, so most
 * of the band sat empty. This fills it with the drifting atom field, and
 * gives the pages that hold real numbers somewhere to show them.
 *
 * The home hero is deliberately not built from this - it keeps its own
 * threads and stays the one page that looks like that.
 *
 * Children are each page's own eyebrow, heading and intro, passed through
 * untouched - this wraps them and never restyles them, so the copy and the
 * heading levels the pages ship stay exactly as they were.
 *
 * @param {object} props
 * @param {string} [props.padding] band padding, matching what the page used
 * @param {object} [props.style] extra band style, merged over the padding
 * @param {{num: number|string, label: string}[]} [props.facts]
 *   Figures for the right-hand side. Passing an array reserves the column even
 *   while it is empty, so the heading does not reflow from full width to
 *   two-thirds when a fetch lands. Omit it entirely for pages with nothing
 *   genuine to count, and for pages that already show the same numbers further
 *   down - those get the visual alone, at full width, rather than a repeated
 *   or invented statistic.
 * @param {import('react').ReactNode} props.children
 */
export default function PageHero({ padding = '80px 0 100px', style, facts = null, children }) {
  // The atoms lean away from the cursor anywhere over the band, not just over
  // the canvas, so the whole hero is the interaction surface.
  const stageRef = useRef(null);
  // An array, even an empty one, means figures are expected here.
  const hasFactsColumn = Array.isArray(facts);

  return (
    <div className="page-hero red-stage" style={{ padding, ...style }} ref={stageRef}>
      <div className="page-hero__bg" aria-hidden="true">
        <AtomField
          className="page-hero__atoms"
          interactionRef={stageRef}
          showGlobe={false}
        />
      </div>

      <Container style={{ position: 'relative', zIndex: 2 }}>
        {hasFactsColumn ? (
          <Row className="align-items-center g-4">
            <Col lg={7}>{children}</Col>
            <Col lg={5}>
              {/* Printed, not counted up. These are small numbers a few
                  pixels from the heading, and a count-up spends its first
                  frames showing 0 - which reads as "no open roles" rather
                  than as an animation. The stat strip on About counts up
                  because 1,500 earns it. */}
              <dl className="page-hero__facts">
                {facts.map((fact) => (
                  <div className="page-hero__fact" key={fact.label}>
                    <dt>{fact.num}</dt>
                    <dd>{fact.label}</dd>
                  </div>
                ))}
              </dl>
            </Col>
          </Row>
        ) : (
          children
        )}
      </Container>
    </div>
  );
}
