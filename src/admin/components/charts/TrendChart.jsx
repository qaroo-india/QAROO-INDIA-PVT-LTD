import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { linePath } from '../../utils/activity.js';

/**
 * Multi-series area chart with a hover crosshair.
 *
 * Drawn at the element's real pixel width rather than a scaled viewBox, so the
 * axis labels stay at their intended size on a wide screen instead of being
 * stretched with the rest of the drawing.
 */

const PAD_L = 34;
const PAD_R = 10;
const PAD_T = 12;
const PAD_B = 22;

function useWidth(ref) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof ResizeObserver === 'undefined') {
      setW(el.clientWidth);
      return undefined;
    }
    const ro = new ResizeObserver(([entry]) => setW(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

export default function TrendChart({ series, labels, height = 210, emptyHint = 'No activity in this period yet.' }) {
  const wrapRef = useRef(null);
  const width = useWidth(wrapRef);
  const [hover, setHover] = useState(null);

  const live = useMemo(() => series.filter((s) => s.values.some((v) => v > 0)), [series]);
  const max = useMemo(
    () => Math.max(1, ...series.flatMap((s) => s.values)),
    [series],
  );

  const plotW = Math.max(0, width - PAD_L - PAD_R);
  const plotH = Math.max(0, height - PAD_T - PAD_B);
  const count = labels.length;
  const step = count > 1 ? plotW / (count - 1) : 0;

  const onMove = useCallback((e) => {
    if (!plotW || count === 0) return;
    const box = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - box.left - PAD_L;
    const i = Math.max(0, Math.min(count - 1, Math.round(x / (step || 1))));
    setHover(i);
  }, [plotW, count, step]);

  // A tick every so often, so a 30-day axis does not turn into a smear.
  const tickEvery = count > 14 ? Math.ceil(count / 6) : 1;
  const gridLines = 4;

  return (
    <div className="ft-chart" ref={wrapRef}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`Activity over ${count} periods`}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`ft-fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.42" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {/* horizontal grid + value axis */}
          {Array.from({ length: gridLines + 1 }, (_, i) => {
            const y = PAD_T + (plotH / gridLines) * i;
            const value = Math.round(max - (max / gridLines) * i);
            return (
              <g key={`g${i}`}>
                <line className="ft-grid" x1={PAD_L} y1={y} x2={PAD_L + plotW} y2={y} />
                <text className="ft-axis" x={PAD_L - 7} y={y + 3.5} textAnchor="end">{value}</text>
              </g>
            );
          })}

          {/* series */}
          <g transform={`translate(${PAD_L},${PAD_T})`}>
            {series.map((s) => {
              const scaled = s.values.map((v) => (v / max) * max);
              const d = linePath(scaled, plotW, plotH, { pad: 0 });
              const a = linePath(scaled, plotW, plotH, { area: true, pad: 0 });
              if (!d) return null;
              return (
                <g key={s.key} className="ft-series">
                  <path d={a} fill={`url(#ft-fill-${s.key})`} />
                  <path d={d} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" />
                </g>
              );
            })}

            {hover !== null && (
              <g className="ft-cross">
                <line x1={hover * step} y1={0} x2={hover * step} y2={plotH} />
                {series.map((s) => {
                  const v = s.values[hover] ?? 0;
                  const y = plotH - (v / max) * plotH;
                  return <circle key={s.key} cx={hover * step} cy={y} r="3.5" fill={s.color} />;
                })}
              </g>
            )}
          </g>

          {/* period axis */}
          {labels.map((l, i) => (
            i % tickEvery === 0 || i === count - 1 ? (
              <text
                key={`l${i}`}
                className={`ft-axis${hover === i ? ' is-on' : ''}`}
                x={PAD_L + i * step}
                y={height - 6}
                textAnchor={i === 0 ? 'start' : i === count - 1 ? 'end' : 'middle'}
              >
                {l}
              </text>
            ) : null
          ))}
        </svg>
      )}

      {hover !== null && (
        <div
          className="ft-tip"
          style={{
            left: `${Math.min(Math.max(PAD_L + hover * step, 60), Math.max(60, width - 60))}px`,
          }}
        >
          <b>{labels[hover]}</b>
          {live.length === 0 && <span className="ft-tip__none">no records</span>}
          {live.map((s) => (
            <span key={s.key}>
              <i style={{ background: s.color }} />
              {s.label}
              <em>{s.values[hover] ?? 0}</em>
            </span>
          ))}
        </div>
      )}

      {live.length === 0 && <p className="ft-empty">{emptyHint}</p>}
    </div>
  );
}
