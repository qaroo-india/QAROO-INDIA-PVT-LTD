import { useEffect, useRef } from 'react';

/**
 * Gives every card in the admin shell a highlight that follows the cursor.
 *
 * One delegated listener on the shell rather than a listener per card: cards
 * mount and unmount on every route change, and a few hundred of them on a long
 * list page would otherwise each carry their own handler. The position is
 * written as CSS custom properties and the look is left entirely to the
 * stylesheet, so nothing here decides how it renders.
 */

const TARGETS = '.admin-card, .dash-stat, .dash-quick__item, .dash-hero, .ft-panel';

export default function useSpotlight() {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;

    // A pointer highlight is motion; respect the system preference.
    const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (motion?.matches) return undefined;

    // A coarse pointer has no hover, so the glow would only ever stick where
    // the last tap landed.
    const fine = window.matchMedia?.('(hover: hover) and (pointer: fine)');
    if (fine && !fine.matches) return undefined;

    let frame = 0;
    let pending = null;
    let current = null;

    const paint = () => {
      frame = 0;
      if (!pending) return;
      const { el, x, y } = pending;
      pending = null;
      if (current && current !== el) current.classList.remove('is-lit');
      current = el;
      el.classList.add('is-lit');
      el.style.setProperty('--mx', `${x.toFixed(1)}px`);
      el.style.setProperty('--my', `${y.toFixed(1)}px`);
    };

    const onMove = (e) => {
      const el = e.target instanceof Element ? e.target.closest(TARGETS) : null;
      if (!el) {
        if (current) { current.classList.remove('is-lit'); current = null; }
        return;
      }
      const box = el.getBoundingClientRect();
      pending = { el, x: e.clientX - box.left, y: e.clientY - box.top };
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const onLeave = () => {
      if (current) { current.classList.remove('is-lit'); current = null; }
      pending = null;
    };

    root.addEventListener('pointermove', onMove, { passive: true });
    root.addEventListener('pointerleave', onLeave, { passive: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
      if (current) current.classList.remove('is-lit');
    };
  }, []);

  return ref;
}
