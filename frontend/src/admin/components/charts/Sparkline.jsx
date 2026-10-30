import { linePath } from '../../utils/activity.js';

/**
 * The small trace on a stat tile. Decorative next to the figure it sits under,
 * so it is hidden from assistive tech - the number and label already say it.
 */
export default function Sparkline({ values, color, width = 104, height = 26 }) {
  if (!values || values.length < 2) return null;
  const d = linePath(values, width, height, { pad: 3 });
  const area = linePath(values, width, height, { area: true, pad: 3 });
  const id = `sp-${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg className="ft-spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
