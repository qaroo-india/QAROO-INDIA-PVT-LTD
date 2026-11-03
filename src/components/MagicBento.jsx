import { useRef, useEffect, useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import './MagicBento.css';
import CountUp from './CountUp';
import Icon from './Icon';

const DEFAULT_PARTICLE_COUNT = 12;
const DEFAULT_SPOTLIGHT_RADIUS = 300;
const DEFAULT_GLOW_COLOR = '132, 0, 255';
const MOBILE_BREAKPOINT = 768;

const createParticleElement = (x, y, color = DEFAULT_GLOW_COLOR) => {
  const el = document.createElement('div');
  el.className = 'particle';
  el.style.cssText = `
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(${color}, 1);
    box-shadow: 0 0 6px rgba(${color}, 0.6);
    pointer-events: none;
    z-index: 100;
    left: 0;
    top: 0;
    transform: translate(${x}px, ${y}px);
  `;
  return el;
};

const calculateSpotlightValues = radius => ({
  proximity: radius * 0.5,
  fadeDistance: radius * 0.75
});

const updateCardGlowProperties = (card, mouseX, mouseY, glow, radius) => {
  const rect = card.getBoundingClientRect();
  const relativeX = ((mouseX - rect.left) / rect.width) * 100;
  const relativeY = ((mouseY - rect.top) / rect.height) * 100;

  card.style.setProperty('--glow-x', `${relativeX}%`);
  card.style.setProperty('--glow-y', `${relativeY}%`);
  card.style.setProperty('--glow-intensity', glow.toString());
  card.style.setProperty('--glow-radius', `${radius}px`);
};

const ParticleCard = ({
  children,
  className = '',
  disableAnimations = false,
  style,
  particleCount = DEFAULT_PARTICLE_COUNT,
  glowColor = DEFAULT_GLOW_COLOR,
  enableTilt = true,
  clickEffect = false,
  enableMagnetism = false,
  link
}) => {
  const cardRef = useRef(null);
  const navigate = useNavigate();
  const particlesRef = useRef([]);
  const timeoutsRef = useRef([]);
  const isHoveredRef = useRef(false);
  const memoizedParticles = useRef([]);
  const particlesInitialized = useRef(false);
  const magnetismAnimationRef = useRef(null);

  const initializeParticles = useCallback(() => {
    if (particlesInitialized.current || !cardRef.current) return;

    const { width, height } = cardRef.current.getBoundingClientRect();
    memoizedParticles.current = Array.from({ length: particleCount }, () =>
      createParticleElement(Math.random() * width, Math.random() * height, glowColor)
    );
    particlesInitialized.current = true;
  }, [particleCount, glowColor]);

  const clearAllParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    magnetismAnimationRef.current?.kill();

    particlesRef.current.forEach(particle => {
      gsap.to(particle, {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        ease: 'back.in(1.7)',
        onComplete: () => {
          particle.parentNode?.removeChild(particle);
        }
      });
    });
    particlesRef.current = [];
  }, []);

  const animateParticles = useCallback(() => {
    if (!cardRef.current || !isHoveredRef.current) return;

    if (!particlesInitialized.current) {
      initializeParticles();
    }

    const fragment = document.createDocumentFragment();
    const clones = [];

    memoizedParticles.current.forEach((particle, index) => {
      const clone = particle.cloneNode(true);
      fragment.appendChild(clone);
      clones.push(clone);

      const timeoutId = setTimeout(() => {
        if (!isHoveredRef.current || !cardRef.current) return;

        particlesRef.current.push(clone);

        gsap.fromTo(clone, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' });

        gsap.to(clone, {
          x: (Math.random() - 0.5) * 100,
          y: (Math.random() - 0.5) * 100,
          rotation: Math.random() * 360,
          duration: 2 + Math.random() * 2,
          ease: 'none',
          repeat: -1,
          yoyo: true
        });

        gsap.to(clone, {
          opacity: 0.3,
          duration: 1.5,
          ease: 'power2.inOut',
          repeat: -1,
          yoyo: true
        });
      }, index * 100);

      timeoutsRef.current.push(timeoutId);
    });

    cardRef.current.appendChild(fragment);
  }, [initializeParticles]);

  useEffect(() => {
    if (disableAnimations || !cardRef.current) return;

    const element = cardRef.current;

    const handleMouseEnter = () => {
      isHoveredRef.current = true;
      animateParticles();

      if (enableTilt) {
        gsap.to(element, {
          rotateX: 5,
          rotateY: 5,
          duration: 0.3,
          ease: 'power2.out',
          transformPerspective: 1000
        });
      }
    };

    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      clearAllParticles();

      if (enableTilt) {
        gsap.to(element, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      }

      if (enableMagnetism) {
        gsap.to(element, {
          x: 0,
          y: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    };

    const handleMouseMove = e => {
      if (!enableTilt && !enableMagnetism) return;

      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      if (enableTilt) {
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;

        gsap.to(element, {
          rotateX,
          rotateY,
          duration: 0.1,
          ease: 'power2.out',
          transformPerspective: 1000
        });
      }

      if (enableMagnetism) {
        const magnetX = (x - centerX) * 0.05;
        const magnetY = (y - centerY) * 0.05;

        magnetismAnimationRef.current = gsap.to(element, {
          x: magnetX,
          y: magnetY,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    };

    const handleClick = e => {
      if (link) {
        navigate(link);
        return;
      }
      if (!clickEffect) return;

      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height)
      );

      const ripple = document.createElement('div');
      ripple.style.cssText = `
        position: absolute;
        width: ${maxDistance * 2}px;
        height: ${maxDistance * 2}px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(${glowColor}, 0.4) 0%, rgba(${glowColor}, 0.2) 30%, transparent 70%);
        left: 0;
        top: 0;
        transform: translate(${x - maxDistance}px, ${y - maxDistance}px);
        pointer-events: none;
        z-index: 1000;
      `;

      element.appendChild(ripple);

      gsap.fromTo(
        ripple,
        { scale: 0, opacity: 1 },
        {
          scale: 1,
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out',
          onComplete: () => ripple.remove()
        }
      );
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('click', handleClick);

    return () => {
      isHoveredRef.current = false;
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('click', handleClick);
      clearAllParticles();
    };
  }, [animateParticles, clearAllParticles, disableAnimations, enableTilt, enableMagnetism, clickEffect, glowColor, link, navigate]);

  return (
    <div
      ref={cardRef}
      className={`${className} particle-container`}
      style={{ ...style, position: 'relative', overflow: 'hidden' }}
    >
      {children}
    </div>
  );
};

const GlobalSpotlight = ({
  gridRef,
  disableAnimations = false,
  enabled = true,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  glowColor = DEFAULT_GLOW_COLOR
}) => {
  const spotlightRef = useRef(null);
  const isInsideSection = useRef(false);
  const rafRef = useRef(0);

  useEffect(() => {
    if (disableAnimations || !gridRef?.current || !enabled) return;

    const spotlight = document.createElement('div');
    spotlight.className = 'global-spotlight';
    spotlight.style.cssText = `
      position: fixed;
      width: 800px;
      height: 800px;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle,
        rgba(${glowColor}, 0.15) 0%,
        rgba(${glowColor}, 0.08) 15%,
        rgba(${glowColor}, 0.04) 25%,
        rgba(${glowColor}, 0.02) 40%,
        rgba(${glowColor}, 0.01) 65%,
        transparent 70%
      );
      z-index: 200;
      opacity: 0;
      mix-blend-mode: screen;
    `;
    document.body.appendChild(spotlight);
    spotlightRef.current = spotlight;

    const { proximity, fadeDistance } = calculateSpotlightValues(spotlightRadius);
    let cachedCards = null;
    let cachedCardsTime = 0;

    const handleMouseMove = e => {
      if (rafRef.current) return;

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;

        if (!spotlightRef.current || !gridRef.current) return;

        const section = gridRef.current.closest('.bento-section');
        const rect = section?.getBoundingClientRect();
        const mouseInside =
          rect && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;

        isInsideSection.current = mouseInside || false;

        const now = Date.now();
        if (!cachedCards || now - cachedCardsTime > 500) {
          cachedCards = Array.from(gridRef.current.querySelectorAll('.magic-bento-card'));
          cachedCardsTime = now;
        }

        if (!mouseInside) {
          gsap.to(spotlightRef.current, {
            opacity: 0,
            duration: 0.3,
            ease: 'power2.out'
          });
          cachedCards.forEach(card => {
            card.style.setProperty('--glow-intensity', '0');
          });
          return;
        }

        let minDistance = Infinity;

        cachedCards.forEach(card => {
          const cardRect = card.getBoundingClientRect();
          const centerX = cardRect.left + cardRect.width / 2;
          const centerY = cardRect.top + cardRect.height / 2;
          const distance =
            Math.hypot(e.clientX - centerX, e.clientY - centerY) - Math.max(cardRect.width, cardRect.height) / 2;
          const effectiveDistance = Math.max(0, distance);

          minDistance = Math.min(minDistance, effectiveDistance);

          let glowIntensity = 0;
          if (effectiveDistance <= proximity) {
            glowIntensity = 1;
          } else if (effectiveDistance <= fadeDistance) {
            glowIntensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity);
          }

          updateCardGlowProperties(card, e.clientX, e.clientY, glowIntensity, spotlightRadius);
        });

        gsap.to(spotlightRef.current, {
          x: e.clientX,
          y: e.clientY,
          duration: 0.1,
          ease: 'power2.out'
        });

        const targetOpacity =
          minDistance <= proximity
            ? 0.8
            : minDistance <= fadeDistance
              ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8
              : 0;

        gsap.to(spotlightRef.current, {
          opacity: targetOpacity,
          duration: targetOpacity > 0 ? 0.2 : 0.5,
          ease: 'power2.out'
        });
      });
    };

    const handleMouseLeave = () => {
      isInsideSection.current = false;
      if (cachedCards) {
        cachedCards.forEach(card => {
          card.style.setProperty('--glow-intensity', '0');
        });
      }
      if (spotlightRef.current) {
        gsap.to(spotlightRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      spotlightRef.current?.parentNode?.removeChild(spotlightRef.current);
    };
  }, [gridRef, disableAnimations, enabled, spotlightRadius, glowColor]);

  return null;
};

const BentoCardGrid = ({ children, gridRef }) => (
  <div className="card-grid bento-section" ref={gridRef}>
    {children}
  </div>
);

const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

const BentoCard = ({
  cardProps,
  shouldDisableAnimations,
  enableTilt,
  enableMagnetism,
  clickEffect,
  glowColor,
  link,
  children
}) => {
  const elRef = useRef(null);
  const cleanupRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const el = elRef.current;
    if (!el || shouldDisableAnimations) return;

    let rafId = 0;

    const handleMouseMove = e => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        if (enableTilt) {
          const rotateX = ((y - centerY) / centerY) * -10;
          const rotateY = ((x - centerX) / centerX) * 10;
          gsap.to(el, {
            rotateX,
            rotateY,
            duration: 0.1,
            ease: 'power2.out',
            transformPerspective: 1000
          });
        }

        if (enableMagnetism) {
          const magnetX = (x - centerX) * 0.05;
          const magnetY = (y - centerY) * 0.05;
          gsap.to(el, {
            x: magnetX,
            y: magnetY,
            duration: 0.3,
            ease: 'power2.out'
          });
        }
      });
    };

    const handleMouseLeave = () => {
      if (enableTilt) {
        gsap.to(el, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      }

      if (enableMagnetism) {
        gsap.to(el, {
          x: 0,
          y: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    };

    const handleClick = e => {
      if (link) {
        navigate(link);
        return;
      }
      if (!clickEffect) return;

      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height)
      );

      const ripple = document.createElement('div');
      ripple.style.cssText = `
        position: absolute;
        width: ${maxDistance * 2}px;
        height: ${maxDistance * 2}px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(${glowColor}, 0.4) 0%, rgba(${glowColor}, 0.2) 30%, transparent 70%);
        left: 0;
        top: 0;
        transform: translate(${x - maxDistance}px, ${y - maxDistance}px);
        pointer-events: none;
        z-index: 1000;
      `;

      el.appendChild(ripple);

      gsap.fromTo(
        ripple,
        { scale: 0, opacity: 1 },
        {
          scale: 1,
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out',
          onComplete: () => ripple.remove()
        }
      );
    };

    el.addEventListener('mousemove', handleMouseMove, { passive: true });
    el.addEventListener('mouseleave', handleMouseLeave);
    el.addEventListener('click', handleClick);

    cleanupRef.current = () => {
      cancelAnimationFrame(rafId);
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
      el.removeEventListener('click', handleClick);
    };

    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [shouldDisableAnimations, enableTilt, enableMagnetism, clickEffect, glowColor, link, navigate]);

  return (
    <div
      ref={elRef}
      {...cardProps}
    >
      {children}
    </div>
  );
};

const MagicBento = ({
  cards,
  textAutoHide = true,
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  disableAnimations = false,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  particleCount = DEFAULT_PARTICLE_COUNT,
  enableTilt = false,
  glowColor = DEFAULT_GLOW_COLOR,
  clickEffect = true,
  enableMagnetism = true
}) => {
  const gridRef = useRef(null);
  const isMobile = useMobileDetection();
  const shouldDisableAnimations = disableAnimations || isMobile;
  const data = cards;

  return (
    <>
      {enableSpotlight && (
        <GlobalSpotlight
          gridRef={gridRef}
          disableAnimations={shouldDisableAnimations}
          enabled={enableSpotlight}
          spotlightRadius={spotlightRadius}
          glowColor={glowColor}
        />
      )}

      <BentoCardGrid gridRef={gridRef}>
        {data.map((card, index) => {
          const baseClassName = `magic-bento-card ${textAutoHide ? 'magic-bento-card--text-autohide' : ''} ${enableBorderGlow ? 'magic-bento-card--border-glow' : ''} ${card.link ? 'magic-bento-card--linked' : ''}`;
          const cardProps = {
            className: baseClassName,
            style: {
              backgroundColor: card.color,
              '--glow-color': glowColor
            }
          };

          const inner = (
            <>
              <div className="magic-bento-card__header">
                <div className="magic-bento-card__label">{card.label}</div>
              </div>
              {card.metric ? (
                <div className="magic-bento-card__metric">
                  <span className="magic-bento-card__metric-value">
                    <CountUp to={card.metric.value} duration={1.4} />
                  </span>
                  <span className="magic-bento-card__metric-unit">{card.metric.unit}</span>
                  {card.metric.live ? (
                    <span className="magic-bento-card__metric-live">live</span>
                  ) : null}
                </div>
              ) : null}
              <div className="magic-bento-card__content">
                <h2 className="magic-bento-card__title">{card.title}</h2>
                <p className="magic-bento-card__description">{card.description}</p>
                {card.link ? (
                  // A real link, not just the card's click handler: it gives the
                  // destination a visible affordance and makes the card
                  // reachable by keyboard. stopPropagation keeps the card's own
                  // navigate from pushing a second history entry.
                  <Link
                    to={card.link}
                    className="magic-bento-card__cta"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {card.linkLabel || 'Explore'}
                    <Icon name="arrow-right" size={15} strokeWidth={2} />
                  </Link>
                ) : null}
              </div>
            </>
          );

          if (enableStars) {
            return (
              <ParticleCard
                key={index}
                {...cardProps}
                disableAnimations={shouldDisableAnimations}
                particleCount={particleCount}
                glowColor={glowColor}
                enableTilt={enableTilt}
                clickEffect={clickEffect}
                enableMagnetism={enableMagnetism}
                link={card.link}
              >
                {inner}
              </ParticleCard>
            );
          }

          return (
            <BentoCard
              key={index}
              cardProps={cardProps}
              shouldDisableAnimations={shouldDisableAnimations}
              enableTilt={enableTilt}
              enableMagnetism={enableMagnetism}
              clickEffect={clickEffect}
              glowColor={glowColor}
              link={card.link}
            >
              {inner}
            </BentoCard>
          );
        })}
      </BentoCardGrid>
    </>
  );
};

export default MagicBento;
