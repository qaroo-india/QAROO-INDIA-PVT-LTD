import { useRef } from 'react';

export default function TiltCard({ children, max = 9, className = '', style, ...rest }) {
  const outerRef = useRef(null);
  const innerRef = useRef(null);

  const onMouseMove = (e) => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const r = outer.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    inner.style.transform = `rotateY(${(px * max).toFixed(2)}deg) rotateX(${(-py * max).toFixed(2)}deg)`;
  };

  const onMouseLeave = () => {
    if (innerRef.current) innerRef.current.style.transform = '';
  };

  return (
    <div
      ref={outerRef}
      className={`tilt-wrap ${className}`}
      style={{ height: '100%', ...style }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      {...rest}
    >
      <div ref={innerRef} className="tilt-card" style={{ height: '100%' }}>
        {children}
      </div>
    </div>
  );
}