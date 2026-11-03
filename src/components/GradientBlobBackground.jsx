/**
 * GradientBlobBackground
 * Drop this behind any section (hero, landing page, etc).
 * Usage:
 *   <div style={{ position: "relative" }}>
 *     <GradientBlobBackground />
 *     <YourContent />
 *   </div>
 */
export default function GradientBlobBackground({
  colors = ["#7F77DD", "#1D9E75", "#D85A30"],
  opacity = 0.18,
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        zIndex: -1,
        opacity,
      }}
    >
      <style>{`
        @keyframes blobMove1 {
          0%   { transform: translate(0, 0) scale(1); border-radius: 40% 60% 60% 40% / 60% 30% 70% 40%; }
          33%  { transform: translate(10%, -15%) scale(1.15); border-radius: 60% 40% 30% 70% / 50% 60% 30% 60%; }
          66%  { transform: translate(-10%, 10%) scale(0.9); border-radius: 30% 70% 40% 60% / 40% 50% 60% 30%; }
          100% { transform: translate(0, 0) scale(1); border-radius: 40% 60% 60% 40% / 60% 30% 70% 40%; }
        }
        @keyframes blobMove2 {
          0%   { transform: translate(0, 0) scale(1); border-radius: 60% 40% 30% 70% / 50% 60% 40% 50%; }
          50%  { transform: translate(-15%, 15%) scale(1.2); border-radius: 40% 60% 70% 30% / 30% 50% 60% 60%; }
          100% { transform: translate(0, 0) scale(1); border-radius: 60% 40% 30% 70% / 50% 60% 40% 50%; }
        }
        @keyframes blobMove3 {
          0%   { transform: translate(0, 0) scale(1); border-radius: 50% 50% 40% 60% / 40% 60% 50% 50%; }
          40%  { transform: translate(12%, 8%) scale(0.85); border-radius: 70% 30% 60% 40% / 60% 40% 50% 50%; }
          80%  { transform: translate(-8%, -12%) scale(1.1); border-radius: 30% 70% 40% 60% / 50% 50% 60% 40%; }
          100% { transform: translate(0, 0) scale(1); border-radius: 50% 50% 40% 60% / 40% 60% 50% 50%; }
        }
        .blob {
          position: absolute;
          filter: blur(80px);
          will-change: transform, border-radius;
        }
      `}</style>

      <div
        className="blob"
        style={{
          top: "-10%",
          left: "-5%",
          width: "45%",
          height: "45%",
          background: colors[0],
          animation: "blobMove1 18s ease-in-out infinite",
        }}
      />
      <div
        className="blob"
        style={{
          top: "20%",
          right: "-10%",
          width: "40%",
          height: "40%",
          background: colors[1],
          animation: "blobMove2 22s ease-in-out infinite",
        }}
      />
      <div
        className="blob"
        style={{
          bottom: "-15%",
          left: "20%",
          width: "50%",
          height: "50%",
          background: colors[2],
          animation: "blobMove3 20s ease-in-out infinite",
        }}
      />
    </div>
  );
}