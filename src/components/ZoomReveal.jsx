import { useState } from 'react';
import './ZoomReveal.css';

export default function ZoomReveal({
  front,
  back,
  aspectRatio = '4 / 3',
  className = '',
  style
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div
      className={`zoom-reveal${revealed ? ' is-revealed' : ''}${className ? ` ${className}` : ''}`.trim()}
      style={{ aspectRatio, ...style }}
      onClick={() => setRevealed((v) => !v)}
      role="button"
      tabIndex={0}
      aria-label="Toggle project impact"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setRevealed((v) => !v);
        }
      }}
    >
      <div className="zoom-reveal__layer zoom-reveal__front">{front}</div>
      <div className="zoom-reveal__layer zoom-reveal__back">{back}</div>
    </div>
  );
}
