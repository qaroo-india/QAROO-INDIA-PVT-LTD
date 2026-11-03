import { useRef, useEffect, useCallback } from 'react';

/**
 * Global click micro-interaction: a short burst of sparks wherever the page is
 * clicked. Mounted once around the whole app, so every button, card and icon
 * gets the same confirmation without its own component.
 *
 * The canvas is viewport-sized and fixed, so a long page costs the same as a
 * short one, and the animation loop only runs while sparks are alive.
 */
const ClickSpark = ({
  sparkColor = '#fff',
  sparkSize = 10,
  sparkRadius = 15,
  sparkCount = 8,
  duration = 400,
  easing = 'ease-out',
  extraScale = 1.0,
  children
}) => {
  const canvasRef = useRef(null);
  const sparksRef = useRef([]);
  const rafRef = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let resizeTimeout;

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      sizeRef.current.w = w;
      sizeRef.current.h = h;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      // Resizing resets the context, so the DPR transform is re-applied here.
      canvas.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resizeCanvas, 120);
    };

    resizeCanvas();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  const easeFunc = useCallback(
    t => {
      switch (easing) {
        case 'linear':
          return t;
        case 'ease-in':
          return t * t;
        case 'ease-in-out':
          return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        default:
          return t * (2 - t);
      }
    },
    [easing]
  );

  // Stop the loop as soon as the last spark fades, and restart it on the next
  // click - no permanent requestAnimationFrame for a mostly idle effect.
  const runLoop = useCallback(() => {
    if (rafRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const draw = timestamp => {
      ctx.clearRect(0, 0, sizeRef.current.w, sizeRef.current.h);

      sparksRef.current = sparksRef.current.filter(spark => {
        const elapsed = timestamp - spark.startTime;
        if (elapsed >= duration) return false;

        const eased = easeFunc(elapsed / duration);
        const distance = eased * sparkRadius * extraScale;
        const lineLength = sparkSize * (1 - eased);
        const cos = Math.cos(spark.angle);
        const sin = Math.sin(spark.angle);

        ctx.strokeStyle = sparkColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(spark.x + distance * cos, spark.y + distance * sin);
        ctx.lineTo(spark.x + (distance + lineLength) * cos, spark.y + (distance + lineLength) * sin);
        ctx.stroke();

        return true;
      });

      if (sparksRef.current.length) {
        rafRef.current = requestAnimationFrame(draw);
      } else {
        rafRef.current = 0;
      }
    };

    rafRef.current = requestAnimationFrame(draw);
  }, [duration, easeFunc, extraScale, sparkColor, sparkRadius, sparkSize]);

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    },
    []
  );

  const handleClick = e => {
    if (!canvasRef.current) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    // The canvas is fixed to the viewport, so client coordinates map directly.
    const now = performance.now();
    for (let i = 0; i < sparkCount; i++) {
      sparksRef.current.push({
        x: e.clientX,
        y: e.clientY,
        angle: (2 * Math.PI * i) / sparkCount,
        startTime: now
      });
    }
    runLoop();
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%'
      }}
      onClick={handleClick}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          display: 'block',
          userSelect: 'none',
          pointerEvents: 'none',
          zIndex: 1300
        }}
      />
      {children}
    </div>
  );
};

export default ClickSpark;
