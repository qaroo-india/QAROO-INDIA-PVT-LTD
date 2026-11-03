/**
 * One consistent icon set for the marketing pages.
 *
 * Single visual system: 24x24 box, stroked with `currentColor`, round caps and
 * joins, no fills except for intentional dots. Sizing and weight are props so
 * every usage stays on the same grid instead of hand-rolled SVG per page.
 */

const PATHS = {
  'arrow-right': (
    <>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  'map-pin': (
    <>
      <path d="M20 10.5c0 5.5-8 11.5-8 11.5S4 16 4 10.5a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10.2" r="2.8" />
    </>
  ),
  landmark: (
    <>
      <path d="m2.5 10 9.5-6.5 9.5 6.5" />
      <path d="M5 10v9" />
      <path d="M19 10v9" />
      <path d="M9.5 19v-5.5" />
      <path d="M14.5 19v-5.5" />
      <path d="M2.5 21h19" />
    </>
  ),
  'file-check': (
    <>
      <path d="M14.5 2.5H7a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2.5V7h5" />
      <path d="m8.8 14.6 2 2 4.4-4.5" />
    </>
  ),
  'shield-check': (
    <>
      <path d="M12 21.5s7.5-3.8 7.5-9.5V5.4L12 2.5 4.5 5.4V12c0 5.7 7.5 9.5 7.5 9.5Z" />
      <path d="m8.8 11.8 2.2 2.2 4.2-4.4" />
    </>
  ),
  lock: (
    <>
      <rect x="3.5" y="10.5" width="17" height="11" rx="2.2" />
      <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" />
      <path d="M12 15v2.5" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="5.5" rx="7.5" ry="3" />
      <path d="M4.5 5.5v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6" />
      <path d="M4.5 11.5v7c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-7" />
    </>
  ),
  chart: (
    <>
      <path d="M3.5 20.5h17" />
      <path d="M7 20.5v-5.5" />
      <path d="M12 20.5V7.5" />
      <path d="M17 20.5v-9" />
    </>
  ),
  code: (
    <>
      <path d="m8.5 17-5-5 5-5" />
      <path d="m15.5 7 5 5-5 5" />
      <path d="M13.6 4.5 10.4 19.5" />
    </>
  ),
  layers: (
    <>
      <path d="m12 2.5 9.5 5-9.5 5-9.5-5 9.5-5Z" />
      <path d="m2.5 12.5 9.5 5 9.5-5" />
      <path d="m2.5 17 9.5 4.5L21.5 17" />
    </>
  ),
  palette: (
    <>
      <path d="M12 21.5a9.5 9.5 0 1 1 9.5-9.5c0 2.2-1.8 3.8-4 3.8h-1.6a2 2 0 0 0-1.5 3.3 1.9 1.9 0 0 1-1.4 2.4Z" />
      <circle cx="7.6" cy="12.4" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="9.8" cy="8.2" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14.4" cy="7.6" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  layout: (
    <>
      <rect x="3" y="3.5" width="18" height="17" rx="2.2" />
      <path d="M3 9.5h18" />
      <path d="M9.5 9.5v11" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m16.2 16.2 4.3 4.3" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  megaphone: (
    <>
      <path d="M4 9.5v5A1.5 1.5 0 0 0 5.5 16H8l8 4.5v-17L8 8H5.5A1.5 1.5 0 0 0 4 9.5Z" />
      <path d="M19 9.2a4 4 0 0 1 0 5.6" />
    </>
  ),
  users: (
    <>
      <path d="M16 20.5v-1.8a4 4 0 0 0-4-4H6.5a4 4 0 0 0-4 4v1.8" />
      <circle cx="9.2" cy="7.6" r="3.6" />
      <path d="M21.5 20.5v-1.8a4 4 0 0 0-3-3.9" />
      <path d="M16.6 4.2a4 4 0 0 1 0 7.2" />
    </>
  ),
  cpu: (
    <>
      <rect x="6.5" y="6.5" width="11" height="11" rx="2" />
      <rect x="10" y="10" width="4" height="4" rx="1" />
      <path d="M9.5 3v3.5" />
      <path d="M14.5 3v3.5" />
      <path d="M9.5 17.5V21" />
      <path d="M14.5 17.5V21" />
      <path d="M3 9.5h3.5" />
      <path d="M3 14.5h3.5" />
      <path d="M17.5 9.5H21" />
      <path d="M17.5 14.5H21" />
    </>
  ),
  film: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.2" />
      <path d="M7.5 4v16" />
      <path d="M16.5 4v16" />
      <path d="M3 12h18" />
      <path d="M3 8h4.5" />
      <path d="M16.5 8H21" />
      <path d="M3 16h4.5" />
      <path d="M16.5 16H21" />
    </>
  ),
  briefcase: (
    <>
      <rect x="2.5" y="7" width="19" height="13.5" rx="2.2" />
      <path d="M8.5 7V5.5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2V7" />
      <path d="M2.5 12.5h19" />
    </>
  ),
  zap: <path d="M13 2.5 4.5 14H11l-1 7.5L19.5 10H13l1-7.5Z" />,
  network: (
    <>
      <circle cx="17.5" cy="5.5" r="2.8" />
      <circle cx="6.5" cy="12" r="2.8" />
      <circle cx="17.5" cy="18.5" r="2.8" />
      <path d="m9 10.6 6-3.7" />
      <path d="m9 13.4 6 3.7" />
    </>
  ),
  graduation: (
    <>
      <path d="m2.5 8.5 9.5-4.5 9.5 4.5-9.5 4.5-9.5-4.5Z" />
      <path d="M6.5 10.8V15c0 1.7 2.5 3 5.5 3s5.5-1.3 5.5-3v-4.2" />
      <path d="M21.5 8.5v5.5" />
    </>
  ),
  heart: (
    <path d="M12 20.5s-7.8-4.6-7.8-10A4.6 4.6 0 0 1 12 7.4a4.6 4.6 0 0 1 7.8 3.1c0 5.4-7.8 10-7.8 10Z" />
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14.5 14.5 0 0 1 0 18 14.5 14.5 0 0 1 0-18Z" />
    </>
  ),
  maximize: (
    <>
      <path d="M8.5 3.5H5.5a2 2 0 0 0-2 2v3" />
      <path d="M15.5 3.5h3a2 2 0 0 1 2 2v3" />
      <path d="M20.5 15.5v3a2 2 0 0 1-2 2h-3" />
      <path d="M3.5 15.5v3a2 2 0 0 0 2 2h3" />
    </>
  ),
  message: (
    <path d="M20.5 11.7a8 8 0 0 1-8.1 8 8.6 8.6 0 0 1-3.7-.85L3.5 20.5l1.75-4.8a8 8 0 0 1-.85-3.6 8 8 0 0 1 8.1-8 8 8 0 0 1 8 7.6Z" />
  ),
  phone: (
    <path d="M21.5 16.9v2.8a2 2 0 0 1-2.2 2 19.6 19.6 0 0 1-8.5-3 19.3 19.3 0 0 1-6-6 19.6 19.6 0 0 1-3-8.6 2 2 0 0 1 2-2.2h2.8a2 2 0 0 1 2 1.7c.12.9.35 1.8.67 2.7a2 2 0 0 1-.45 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.45c.87.32 1.78.55 2.7.67a2 2 0 0 1 1.7 2Z" />
  ),
  'check-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.4 12.2 2.4 2.4 4.8-5" />
    </>
  ),
};

/** Icons that represent security, data or verification content. */
export const TRUST_ICONS = new Set(['shield-check', 'lock', 'database', 'file-check', 'network']);

/**
 * Keyword map used to pick an icon that actually matches the copy.
 * Order matters - the most specific phrases are matched first, and short tokens
 * are word-bounded so "Chennai" cannot read as "AI".
 */
const KEYWORD_ICONS = [
  [/cyber|security|ethical hacking|hacking|protect|threat/i, 'shield-check'],
  [/privacy|confidential|secure|encrypt/i, 'lock'],
  [/data science|\bdata\b|database/i, 'database'],
  [/analytic|analysis|insight|report|metric|measure/i, 'chart'],
  [/full stack|backend|front end|frontend/i, 'layers'],
  [/\bai\b|artificial intelligence|machine learning|deep learning|automation/i, 'cpu'],
  [/animation|vfx|motion|video|film/i, 'film'],
  [/\bcrm\b|customer|client|relationship/i, 'users'],
  [/marketing|\bseo\b|campaign|social media|advertis/i, 'megaphone'],
  [/ui\/ux/i, 'layout'],
  [/ux research|research|discovery|user testing/i, 'search'],
  [/\bui\b|\bux\b|interface|prototyp|wireframe/i, 'layout'],
  [/brand|graphic|visual|creative|design/i, 'palette'],
  [/\bweb\b|software|development|developer|\bcode\b|engineering|\bapi\b/i, 'code'],
  [/strategy|consult|roadmap|planning|growth|outcome/i, 'target'],
  [/performance|speed|optimi|efficien|productivity/i, 'zap'],
  [/mou|memorandum|partner|collaborat|network/i, 'network'],
  [/csr|social impact|community|empowerment|responsibility/i, 'heart'],
  [/coimbatore|chennai|office|location|head office|branch|hq/i, 'map-pin'],
  [/institution|academic|college|university|foundation|trust/i, 'landmark'],
  [/learning|training|course|curriculum|skill|career|student|placement/i, 'graduation'],
  [/business|enterprise|company|corporate|industry/i, 'briefcase'],
  [/verified|verification|assur|quality|standard|reliab|trust/i, 'check-circle'],
  [/india|global|nationwide|region/i, 'globe'],
];

/**
 * Pick the icon whose meaning matches a piece of copy.
 * @param {string} text label to classify
 * @param {string} [fallback] icon name to use when nothing matches
 * @returns {string} icon name
 */
export function iconForLabel(text, fallback = 'check-circle') {
  const value = String(text ?? '');
  for (let i = 0; i < KEYWORD_ICONS.length; i++) {
    if (KEYWORD_ICONS[i][0].test(value)) return KEYWORD_ICONS[i][1];
  }
  return fallback;
}

export default function Icon({
  name,
  size = 18,
  strokeWidth = 1.7,
  className = '',
  title,
  style,
  ...rest
}) {
  const glyph = PATHS[name];
  if (!glyph) return null;

  return (
    <svg
      className={`q-icon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : 'true'}
      focusable="false"
      style={style}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {glyph}
    </svg>
  );
}
