import { useEffect, useState } from 'react';

/**
 * Subscribe to a CSS media query.
 * Used to drop expensive hero effects on small screens and to honour
 * `prefers-reduced-motion` without duplicating matchMedia wiring per component.
 *
 * @param {string} query e.g. '(prefers-reduced-motion: reduce)'
 * @returns {boolean}
 */
export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && !!window.matchMedia?.(query).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return undefined;

    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, [query]);

  return matches;
}
