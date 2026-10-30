import { Container } from 'react-bootstrap';
import InkLines from './InkLines.jsx';
import './LinedSection.css';

/**
 * A page section with the ink-line waves behind its content.
 *
 * The learning and business templates were each carrying their own copy of this
 * three-element pattern - positioned section, InkLines, lifted Container - and
 * the careers pages needed a third. One component instead, so the stacking is
 * fixed in a single place.
 *
 * @param {object} props
 * @param {'light'|'dark'} [props.mode] which ink palette to use
 * @param {boolean} [props.narrow] cap the column, for prose and FAQs
 * @param {string} [props.maxWidth] an exact column cap, where a page had one
 * @param {string} [props.className] extra classes on the section
 * @param {object} [props.style] extra style on the section
 */
export default function LinedSection({ mode = 'light', narrow, maxWidth, className = '', style, children }) {
  const cap = maxWidth || (narrow ? '860px' : null);
  return (
    <section className={`page-section lined-section ${className}`.trim()} style={style}>
      <InkLines mode={mode} />
      <Container className="lined-section__inner" style={cap ? { maxWidth: cap } : undefined}>
        {children}
      </Container>
    </section>
  );
}
