import { useMemo, useState } from 'react';

/**
 * Content mix as a donut. Hovering a segment or a legend row lifts that slice
 * and puts its figure in the middle; clicking either calls `onPick`.
 *
 * Segments are drawn as stroked arcs on one circle rather than as wedge paths -
 * a stroke-dasharray offset is exact at any radius and leaves no seam where two
 * slices meet.
 */
export default function DonutChart({ slices, size = 188, thickness = 20, onPick }) {
  const [active, setActive] = useState(null);

  const total = useMemo(() => slices.reduce((s, x) => s + x.value, 0), [slices]);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;

  // Running start angle for each slice.
  const arcs = useMemo(() => {
    let acc = 0;
    return slices.map((s) => {
      const share = total ? s.value / total : 0;
      const arc = { ...s, share, offset: acc };
      acc += share;
      return arc;
    });
  }, [slices, total]);

  const shown = active !== null ? arcs[active] : null;

  return (
    <div className="ft-donut">
      <div className="ft-donut__ring" style={{ width: size, height: size }}>
        <svg width={size} height={size} role="img" aria-label="Share of records by section">
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            <circle
              className="ft-donut__track"
              cx={size / 2} cy={size / 2} r={r}
              fill="none" strokeWidth={thickness}
            />
            {arcs.map((a, i) => (
              a.share > 0 && (
                <circle
                  key={a.key}
                  cx={size / 2} cy={size / 2} r={r}
                  fill="none"
                  stroke={a.color}
                  strokeWidth={active === i ? thickness + 6 : thickness}
                  strokeDasharray={`${(a.share * c).toFixed(2)} ${c.toFixed(2)}`}
                  strokeDashoffset={(-a.offset * c).toFixed(2)}
                  strokeLinecap="butt"
                  className="ft-donut__arc"
                  opacity={active === null || active === i ? 1 : 0.32}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  onClick={() => onPick?.(a)}
                />
              )
            ))}
          </g>
        </svg>
        <div className="ft-donut__mid">
          <b>{shown ? shown.value : total}</b>
          <span>{shown ? shown.label : 'total records'}</span>
          {shown && <em>{Math.round(shown.share * 100)}%</em>}
        </div>
      </div>

      <ul className="ft-donut__legend">
        {arcs.map((a, i) => (
          <li key={a.key}>
            <button
              type="button"
              className={active === i ? 'is-on' : ''}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              onClick={() => onPick?.(a)}
            >
              <i style={{ background: a.color }} />
              <span>{a.label}</span>
              <em>{a.value}</em>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
