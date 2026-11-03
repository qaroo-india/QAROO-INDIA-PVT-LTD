/**
 * BlueprintSectionTitle
 * Drawing-annotation style section heading: a mono "PLAN VIEW" eyebrow,
 * a thin specimen rule with a diamond center mark, an optional left index
 * and right aside label - looks like a blueprint callout.
 *
 * Usage:
 *   <BlueprintSectionTitle
 *     eyebrow="Plan view"
 *     title="Our Solutions"
 *     desc="...optional description..."
 *     index="02"
 *   />
 */
export default function BlueprintSectionTitle({
  eyebrow = 'Plan view',
  title,
  desc,
  index,
  aside,
  align = 'left',
  onDark = false,
}) {
  const color = onDark ? 'rgba(255,255,255,0.75)' : 'var(--eduact-text)';
  const accent = 'var(--eduact-base)';
  const rule = onDark ? 'rgba(255,255,255,0.28)' : 'var(--eduact-soft4)';
  const hColor = onDark ? '#fff' : 'var(--eduact-black)';

  return (
    <div
      className="bst-section-title"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'center' ? 'center' : 'flex-start',
        textAlign: align === 'center' ? 'center' : 'left',
        marginBottom: '44px',
        gap: '12px',
        position: 'relative',
      }}
    >
      <style>{`
        .bst-section-title .bst-eyebrow {
          font-family: var(--heading-font);
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: ${color};
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .bst-section-title .bst-eyebrow::before {
          content: "↗";
          color: ${accent};
          font-size: 13px;
        }
        .bst-section-title .bst-title {
          font-size: clamp(26px, 3vw, 38px);
          font-weight: 800;
          color: ${hColor};
          font-family: var(--heading-font);
          margin: 0;
          line-height: 1.15;
        }
        .bst-section-title .bst-rule {
          display: flex;
          align-items: center;
          gap: 6px;
          width: 100%;
          max-width: 560px;
          margin-top: 2px;
        }
        .bst-section-title .bst-rule-line {
          flex: 1;
          height: 1px;
          background: ${rule};
          position: relative;
        }
        .bst-section-title .bst-rule-line::after {
          content: "";
          position: absolute;
          right: 0;
          top: -3px;
          width: 7px;
          height: 7px;
          border-top: 1px solid ${rule};
          border-right: 1px solid ${rule};
        }
        .bst-section-title .bst-rule-diamond {
          width: 8px;
          height: 8px;
          background: transparent;
          border: 1.5px solid ${accent};
          transform: rotate(45deg);
          flex-shrink: 0;
        }
        .bst-section-title .bst-rule-line.bst-rule--right::before {
          content: "";
          position: absolute;
          left: 0;
          top: -3px;
          width: 7px;
          height: 7px;
          border-top: 1px solid ${rule};
          border-left: 1px solid ${rule};
        }
        .bst-section-title .bst-aside {
          font-family: var(--heading-font);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: ${color};
          white-space: nowrap;
        }
        .bst-section-title .bst-index {
          font-family: var(--heading-font);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: ${accent};
          background: transparent;
          border: 1px solid ${rule};
          padding: 4px 10px;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
        }
        .bst-section-title .bst-desc {
          color: ${color};
          max-width: 420px;
          font-size: 15px;
          margin: 0;
        }
      `}</style>

      {(index || eyebrow) && (
        <div className="bst-eyebrow-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="bst-eyebrow">{eyebrow}</span>
          {index && <span className="bst-index">{index}</span>}
        </div>
      )}

      <h2 className="bst-title">{title}</h2>

      <div className="bst-rule" style={{ justifyContent: align === 'center' ? 'center' : 'flex-start' }}>
        <span className="bst-rule-line" />
        <span className="bst-rule-diamond" />
        <span className="bst-rule-line bst-rule--right" />
        {aside && <span className="bst-aside">{aside}</span>}
      </div>

      {desc && <p className="bst-desc">{desc}</p>}
    </div>
  );
}