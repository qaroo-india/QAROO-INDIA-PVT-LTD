/**
 * ArchitecturalFrames
 * A static "spec-drawing" background layer: thin geometric lines, crosshair
 * marks and ruler ticks in the brand palette. Purely decorative.
 * Place it inside a relatively-positioned wrapper; content sits above it.
 *
 * Usage:
 *   <div style={{ position: "relative" }}>
 *     <ArchitecturalFrames />
 *     <YourContent />
 *   </div>
 */
export default function ArchitecturalFrames({
  color = "rgba(23, 42, 70, 0.55)",
  accent = "rgba(179, 38, 45, 0.5)",
  gold = "rgba(244, 196, 48, 0.55)",
  opacity = 0.5,
}) {
  return (
    <div
      className="af-layer"
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        opacity,
      }}
    >
      <style>{`
        .af-layer {
          --af-color: ${color};
          --af-accent: ${accent};
          --af-gold: ${gold};
        }
        .af-diagonal {
          position: absolute;
          inset: -40% -20%;
          background: repeating-linear-gradient(
            65deg,
            var(--af-color) 0px,
            var(--af-color) 1px,
            transparent 1px,
            transparent 92px
          );
        }
        .af-ring {
          position: absolute;
          border-radius: 50%;
          border: 1px solid var(--af-color);
        }
        .af-ring::after {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          width: 8px;
          height: 8px;
          border: 1px solid var(--af-color);
          border-radius: 50%;
          transform: translate(-50%, -50%);
        }
        .af-ring-1 {
          right: -60px;
          top: -60px;
          width: 220px;
          height: 220px;
        }
        .af-ring-2 {
          left: -40px;
          bottom: -40px;
          width: 160px;
          height: 160px;
          border-color: var(--af-gold);
        }
        .af-ring-2::after { border-color: var(--af-gold); }
        .af-cross {
          position: absolute;
          width: 18px;
          height: 18px;
        }
        .af-cross::before,
        .af-cross::after {
          content: "";
          position: absolute;
          background: var(--af-accent);
        }
        .af-cross::before {
          left: 50%;
          top: 0;
          width: 1px;
          height: 100%;
          transform: translateX(-50%);
        }
        .af-cross::after {
          top: 50%;
          left: 0;
          height: 1px;
          width: 100%;
          transform: translateY(-50%);
        }
        .af-cross-1 { top: 18%; left: 12%; }
        .af-cross-2 { top: 62%; right: 9%; }
        .af-cross-3 { bottom: 22%; left: 38%; }
        .af-cross-1::before,
        .af-cross-1::after { background: var(--af-gold); }
        .af-rule {
          position: absolute;
          right: 0;
          top: 24%;
          height: 320px;
          width: 60px;
          border-left: 1px solid var(--af-color);
          border-right: 1px solid var(--af-color);
        }
        .af-rule::before {
          content: "";
          position: absolute;
          top: 0;
          right: 0;
          left: 0;
          height: 1px;
          background: var(--af-color);
        }
        .af-rule::after {
          content: "";
          position: absolute;
          bottom: 0;
          right: 0;
          left: 0;
          height: 1px;
          background: var(--af-color);
        }
        .af-rule i {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 6px;
          height: 6px;
          border: 1px solid var(--af-color);
          transform: translate(-50%, -50%) rotate(45deg);
        }
        .af-rule span {
          position: absolute;
          left: 50%;
          bottom: -20px;
          transform: translateX(-50%);
          font-size: 9px;
          letter-spacing: 0.14em;
          color: var(--af-color);
        }
      `}</style>

      <div className="af-diagonal" />
      <div className="af-ring af-ring-1" />
      <div className="af-ring af-ring-2" />
      <span className="af-cross af-cross-1" />
      <span className="af-cross af-cross-2" />
      <span className="af-cross af-cross-3" />
      <div className="af-rule">
        <i />
        <span>SCALE 1:1</span>
      </div>
    </div>
  );
}