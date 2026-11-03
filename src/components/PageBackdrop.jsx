import GradientBlobBackground from './GradientBlobBackground.jsx';
import './LinedSection.css';

/** The three brand colours, the tint every page using this backdrop shares. */
const BRAND = ['#172A46', '#B3262D', '#F4C430'];

/**
 * Soft brand-coloured blobs behind a whole page.
 *
 * Decorative only, and fixed rather than scrolled, so it reads as a tint on the
 * page instead of a graphic inside one section.
 */
export default function PageBackdrop({ colors = BRAND, opacity = 0.16 }) {
  return (
    <div className="page-backdrop" aria-hidden="true">
      <GradientBlobBackground colors={colors} opacity={opacity} />
    </div>
  );
}
