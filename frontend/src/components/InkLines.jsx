import FloatingLines from './FloatingLines.jsx';

/**
 * InkLines - single reusable ink-lines background layer.
 * Wrap any section's content in a `position:relative` container and drop this
 * as an absolutely positioned backdrop. `mode="dark"` uses the full colour
 * lines; `mode="light"` uses the subtle ink wave look for cream sections.
 */
export default function InkLines({ mode = 'light', opacity = 0.55 }) {
  const light = mode === 'light';
  return (
    <div
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, zIndex: 0, opacity }}
    >
      <FloatingLines
        lightMode={light}
        enabledWaves={light ? ['bottom', 'top'] : ['bottom', 'middle', 'top']}
        lineCount={light ? [10, 12] : [12, 16, 14]}
        lineDistance={light ? [10, 8] : [12, 12, 10]}
        linesGradient={light ? ['#F4C430', '#f28b82', '#5b4f9e', '#F4C430'] : ['#F4C430', '#B3262D', '#172A46', '#F4C430']}
        bendRadius={6}
        bendStrength={light ? -0.4 : 0.5}
        animationSpeed={0.9}
        interactive
        parallax
        parallaxStrength={0.25}
      />
    </div>
  );
}