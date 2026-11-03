import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Container, Row, Col, Modal, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Seo from '../components/Seo.jsx';
import Icon from '../components/Icon';
import { Shimmer, EmptyState, ErrorState } from '../components/ui/States';
import { mouApi } from '../api/mouApi.js';
import { contentApi } from '../api/contentApi.js';
import './MOUDirectory.css';
import PageHero from '../components/PageHero';

const DEFAULT_MOU_PAGE = {
  eyebrow: 'Institutional Partnerships',
  title: 'MOU Directory',
  description: 'Every memorandum of understanding on record - who the partner is, what it can offer students, and our read on how strong the collaboration actually is.',
};

function initials(name) {
  const safe = name || '';
  const leadWord = safe.split(/[\s(]/)[0];
  if (/^[A-Z]{3,6}$/.test(leadWord)) return leadWord;
  const skip = new Set(['of', 'and', 'the', 'for', '&', 'a', 'an', 'pvt.', 'pvt', 'ltd.', 'ltd', 'college', 'university']);
  const clean = safe.replace(/[()]/g, '');
  const words = clean.split(/\s+/).filter(w => w && !skip.has(w.toLowerCase()));
  const letters = (words.length ? words : clean.split(/\s+/)).map(w => (w[0] || '').toUpperCase());
  return letters.slice(0, 4).join('');
}

function logoSize(text) {
  return text.length >= 5 ? { fontSize: '0.72rem', letterSpacing: '0' } : text.length === 4 ? { fontSize: '0.82rem' } : {};
}

// Map known MOU partner names to their logo files in /logos.
const LOGO_MAP = [
  { match: ['snscollegeofengineering'], logo: '/logos/sns.png' },
  { match: ['rajalakshmi'], logo: '/logos/dsra.png' },
  { match: ['edubridge'], logo: '/logos/edubridge.png' },
  { match: ['aisect'], logo: '/logos/aisect.jpg' },
  { match: ['scopeglobalskillsuniversity'], logo: '/logos/scope.png' },
  { match: ['skilldevelopmentnetwork'], logo: '/logos/sdn.png' },
  { match: ['ranganathar'], logo: '/logos/srie.jpg' },
  { match: ['nspcareerpoint'], logo: '/logos/nsp.jpg' },
  { match: ['nsdc'], logo: '/logos/nsdc.jpg' },
  { match: ['ncvet'], logo: '/logos/ncvet.jpg' },
  { match: ['medhavi'], logo: '/logos/medhavi.png' },
  { match: ['gurukul'], logo: '/logos/igec.png' },
  { match: ['christtheking'], logo: '/logos/ckp.png' },
  { match: ['avp'], logo: '/logos/avp.jpg' },
];

function logoFor(name) {
  const n = (name || '').toLowerCase().replace(/[^a-z]/g, '');
  for (const entry of LOGO_MAP) {
    if (entry.match.some((m) => n.includes(m))) return entry.logo;
  }
  return null;
}

function PartnerLogo({ name, logo, size = 48, radius = 12, light = false }) {
  const img = logo || logoFor(name);
  if (!img) {
    const init = initials(name);
    return (
      <span style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: light ? '#fff' : 'var(--eduact-base)',
        color: light ? 'var(--eduact-base)' : '#fff',
        fontFamily: 'var(--heading-font)',
        fontWeight: 800,
        fontSize: '0.95rem',
        letterSpacing: '0.01em',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px',
        flexShrink: 0,
        boxShadow: light ? '0 6px 16px rgba(23, 42, 70,0.18)' : 'none',
        ...logoSize(init),
      }}>{init}</span>
    );
  }
  return (
    <span style={{
      width: size,
      height: size,
      borderRadius: radius,
      background: '#fff',
      border: '1px solid var(--eduact-soft4)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '16px',
      flexShrink: 0,
      overflow: 'hidden',
      padding: '4px',
      boxShadow: light ? '0 6px 16px rgba(23, 42, 70,0.18)' : 'none',
    }}>
      <img src={img} alt={name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
    </span>
  );
}

// Full-width partner logo banner shown at the top of each MOU card.
function PartnerBanner({ name, logo }) {
  const src = logo || logoFor(name);
  const init = initials(name);
  return (
    <div style={{
      width: '100%',
      height: '88px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#fff',
      borderRadius: '12px',
      border: '1px solid var(--eduact-soft4)',
      padding: '10px',
      marginBottom: '18px',
      overflow: 'hidden',
    }}>
      {src ? (
        <img src={src} alt={name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
      ) : (
        <span style={{
          fontFamily: 'var(--heading-font)',
          fontWeight: 800,
          fontSize: '1.5rem',
          letterSpacing: '0.02em',
          color: 'var(--eduact-base)',
          ...logoSize(init),
        }}>{init}</span>
      )}
    </div>
  );
}

export default function MOUDirectory() {
  const [activeTag, setActiveTag] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [activeImg, setActiveImg] = useState(0);
  const [autoPaused, setAutoPaused] = useState(false);
  // Full-size viewer stacked over the detail modal. It keeps its own index so
  // navigating inside it is instant, rather than waiting on the carousel's
  // smooth-scroll to settle and report a new index.
  const [lightbox, setLightbox] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [mous, setMous] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [content, setContent] = useState(DEFAULT_MOU_PAGE);
  const aliveRef = useRef(true);
  const galRef = useRef(null);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    mouApi
      .list({}, { credentials: 'omit' })
      .then((res) => {
        if (aliveRef.current) setMous(res.data.mous || []);
      })
      .catch((err) => {
        if (aliveRef.current) setError(err?.message || 'We could not load the MOU directory. Please try again.');
      })
      .finally(() => {
        if (aliveRef.current) setLoading(false);
      });
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    reload();
    contentApi.get('mou', { credentials: 'omit' })
      .then((res) => { if (aliveRef.current) setContent({ ...DEFAULT_MOU_PAGE, ...(res.data?.content?.data || {}) }); })
      .catch(() => {});
    return () => {
      aliveRef.current = false;
    };
  }, [reload]);

  const tags = useMemo(() => ["All", ...new Set(mous.map(m => m.tag).filter(Boolean))], [mous]);

  // Counted from the published MoUs rather than stated, so the number in the
  // hero is always the number of cards below it.
  const heroFacts = mous.length
    ? [
        { num: mous.length, label: mous.length === 1 ? 'MoU signed' : 'MoUs signed' },
        {
          num: tags.length - 1,
          label: tags.length === 2 ? 'Category' : 'Categories',
        },
      ]
    : [];

  const filtered = useMemo(() => {
    if (activeTag === 'All') return mous;
    return mous.filter(m => m.tag === activeTag);
  }, [activeTag, mous]);

  const openModal = (index) => {
    setModalIndex(index);
    setShowModal(true);
  };

  const m = mous[modalIndex];

  // If the MOUs change (e.g. a refresh) such that the open modal's index is no
  // longer valid, close the modal instead of leaving a blank shell.
  useEffect(() => {
    if (showModal && modalIndex >= mous.length) {
      setShowModal(false);
    }
  }, [showModal, modalIndex, mous.length]);

  useEffect(() => {
    setActiveImg(0);
    if (galRef.current) galRef.current.scrollTop = 0;
  }, [modalIndex]);

  const galCount = (m?.images?.length || 0);

  const scrollGal = useCallback((i) => {
    const el = galRef.current;
    if (!el || galCount < 1) return;
    const target = Math.max(0, Math.min(galCount - 1, i));
    el.scrollTo({ top: target * el.clientHeight, behavior: 'smooth' });
  }, [galCount]);

  const onGalScroll = useCallback(() => {
    const el = galRef.current;
    if (!el || el.clientHeight < 1) return;
    const i = Math.round(el.scrollTop / el.clientHeight);
    setActiveImg(Math.max(0, Math.min(galCount - 1, i)));
  }, [galCount]);

  const openLightbox = useCallback((i) => {
    setLightboxIdx(i);
    setLightbox(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightbox(false);
    // Leave the carousel on whatever image was last viewed.
    scrollGal(lightboxIdx);
  }, [scrollGal, lightboxIdx]);

  const stepLightbox = useCallback((delta) => {
    if (galCount < 1) return;
    setLightboxIdx((prev) => (prev + delta + galCount) % galCount);
  }, [galCount]);

  // Arrow keys page through the viewer; Escape is handled by the modal itself.
  useEffect(() => {
    if (!lightbox) return undefined;
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        stepLightbox(1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        stepLightbox(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, stepLightbox]);

  // Closing the detail view must not leave the viewer orphaned above it.
  useEffect(() => {
    if (!showModal && lightbox) setLightbox(false);
  }, [showModal, lightbox]);

  useEffect(() => {
    // The carousel holds while the viewer is open, so it cannot advance behind it.
    if (!showModal || galCount <= 1 || autoPaused || lightbox) return;
    const timer = setInterval(() => {
      setActiveImg((prev) => {
        const next = prev >= galCount - 1 ? 0 : prev + 1;
        const el = galRef.current;
        if (el) el.scrollTo({ top: next * el.clientHeight, behavior: 'smooth' });
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [showModal, galCount, autoPaused, lightbox]);

  return (
    <>
      <Seo
        title="MOU Directory - Qaroo India Private Limited | Institutional & CSR Partnerships"
        description={`Browse ${mous.length || '20+'} Memorandums of Understanding signed by Qaroo India Private Limited with academic institutions and CSR partners across software development, branding and digital marketing.`}
        path="/mou-directory"
      />
      {/* Header */}
      <PageHero padding="56px 0 64px" facts={heroFacts}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--eduact-secondary)',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          fontSize: '0.78rem',
          marginBottom: '14px',
        }}>
          <span style={{ width: '26px', height: '2px', background: 'var(--eduact-secondary)', display: 'inline-block' }} />
          {content.eyebrow}
        </span>
        <h1 style={{
          fontFamily: 'var(--heading-font)',
          fontWeight: 800,
          color: '#fff',
          fontSize: 'clamp(1.9rem, 4vw, 2.7rem)',
          marginBottom: '10px',
        }}>{content.title}</h1>
        <p style={{
          color: 'rgba(255,255,255,0.7)',
          maxWidth: '640px',
          fontSize: '1rem',
          margin: 0,
        }}>{content.description}</p>
      </PageHero>

      {/* Filter Chips */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        margin: '-28px auto 40px',
        maxWidth: '1140px',
        padding: '0 12px',
        position: 'relative',
        zIndex: 2,
      }}>
        {tags.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTag(t)}
            style={{
              border: 'none',
              background: activeTag === t ? 'var(--eduact-base)' : '#fff',
              color: activeTag === t ? '#fff' : 'var(--eduact-text)',
              fontWeight: 600,
              fontSize: '0.82rem',
              padding: '9px 18px',
              borderRadius: '999px',
              boxShadow: '0 6px 18px rgba(23, 42, 70,0.08)',
              transition: 'background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
              cursor: 'pointer',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Card Grid */}
      <Container style={{ maxWidth: '1140px', padding: '0 12px 80px' }}>
        <Row className="g-3">
          {loading ? (
            <div style={{ width: '100%' }}><Shimmer /></div>
          ) : error ? (
            <div style={{ width: '100%' }}><ErrorState title="Couldn't load the directory" text={error} onRetry={reload} /></div>
          ) : filtered.length === 0 ? (
            <div style={{ width: '100%' }}>
              <EmptyState
                title="No MOUs in this category"
                text="We partner with new institutions regularly - check back soon, or contact us to explore a collaboration."
                action={<Link to="/contact" className="btn-eduact">Start a partnership</Link>}
              />
            </div>
          ) : filtered.map((item) => {
            return (
              <Col key={item.name} xs={12} sm={6} lg={4}>
                <div
                  onClick={() => openModal(mous.indexOf(item))}
                  style={{
                    background: '#fff',
                    borderRadius: '18px',
                    padding: '26px 24px 22px',
                    height: '100%',
                    border: '1px solid var(--eduact-soft4)',
                    transition: 'transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(23, 42, 70,0.1)';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = 'var(--eduact-soft4)';
                  }}
                >
                  <PartnerBanner name={item.name} logo={item.logo} />
                  <Badge style={{
                    display: 'inline-block',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: 'var(--eduact-base)',
                    background: 'var(--eduact-soft3)',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    marginBottom: '12px',
                    width: 'fit-content',
                  }}>{item.tag}</Badge>
                  <h3 style={{
                    fontFamily: 'var(--heading-font)',
                    fontWeight: 700,
                    fontSize: '1.08rem',
                    color: 'var(--eduact-black)',
                    marginBottom: '8px',
                    lineHeight: 1.3,
                  }}>{item.name}</h3>
                  <p style={{
                    color: 'var(--eduact-text)',
                    fontSize: '0.89rem',
                    lineHeight: 1.55,
                    marginBottom: '18px',
                    flexGrow: 1,
                  }}>{item.blurb}</p>
                  <span style={{
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: 'var(--eduact-base)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    View MOU details
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M13 6l6 6-6 6"/>
                    </svg>
                  </span>
                </div>
              </Col>
            );
          })}
        </Row>
      </Container>

      {/* Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl" centered>
        {m && (
          <>
            <div style={{
              background: 'var(--eduact-base)',
              padding: '30px 32px',
              position: 'relative',
              borderRadius: '20px 20px 0 0',
            }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  position: 'absolute',
                  top: '22px',
                  right: '26px',
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >×</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <PartnerLogo name={m.name} logo={m.logo} size={60} radius={16} light />
                <div>
                  <Badge style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: 'var(--eduact-black)',
                    background: 'var(--eduact-secondary)',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    marginBottom: '6px',
                  }}>{m.tag}</Badge>
                  <h3 style={{
                    fontFamily: 'var(--heading-font)',
                    fontWeight: 800,
                    color: '#fff',
                    fontSize: '1.5rem',
                    margin: '6px 0 0',
                  }}>{m.name}</h3>
                </div>
              </div>
            </div>

            <Modal.Body style={{ padding: '30px 32px 8px' }}>
              <Row className="g-4">
                <Col xs={12} lg={7} className="order-2 order-lg-1">
                  {(m.sections || []).map((s, idx) => (
                    <div key={idx} style={{ marginBottom: '26px' }}>
                      <div style={{
                        fontFamily: 'var(--heading-font)',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        color: 'var(--eduact-black)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}>
                        <span style={{
                          width: '4px',
                          height: '16px',
                          background: 'var(--eduact-base)',
                          borderRadius: '2px',
                          display: 'inline-block',
                        }} />
                        {s.heading}
                      </div>

                      {s.paragraphs && s.paragraphs.map((p, pi) => (
                        <p key={pi} style={{ color: 'var(--eduact-text)', fontSize: '0.93rem', lineHeight: 1.65 }}>{p}</p>
                      ))}

                      {s.list && (
                        <ul className="mou-section-list" style={{
                          listStyle: 'none',
                          margin: 0,
                          padding: 0,
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, 1fr)',
                          gap: '8px 14px',
                        }}>
                          {s.list.map((li, liIdx) => (
                            <li key={liIdx} style={{
                              fontSize: '0.88rem',
                              color: 'var(--eduact-black)',
                              background: 'var(--eduact-soft)',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}>
                              <span style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: 'var(--eduact-base)',
                                flexShrink: 0,
                              }} />
                              {li}
                            </li>
                          ))}
                        </ul>
                      )}

                      {s.pathway && (
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          gap: '8px',
                          background: 'var(--eduact-soft2)',
                          borderLeft: '4px solid var(--eduact-base)',
                          borderRadius: '10px',
                          padding: '16px 18px',
                          fontSize: '0.88rem',
                          fontWeight: 700,
                          color: 'var(--eduact-black)',
                        }}>
                          {s.pathway.map((p, pi) => (
                            <span key={pi} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {pi > 0 && <span style={{ color: 'var(--eduact-grey)', fontWeight: 400 }}>{'->'}</span>}
                              <span>{p}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      {s.note && (
                        <div style={{
                          background: 'rgba(244, 196, 48,0.12)',
                          border: '1px solid rgba(244, 196, 48,0.3)',
                          color: 'var(--eduact-black)',
                          borderRadius: '10px',
                          padding: '14px 16px',
                          fontSize: '0.88rem',
                          lineHeight: 1.55,
                          marginTop: '12px',
                        }}>
                          <strong style={{ color: 'var(--eduact-base)' }}>Note:</strong> {s.note}
                        </div>
                      )}
                    </div>
                  ))}
                </Col>

                <Col xs={12} lg={5} className="order-1 order-lg-2">
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: '100%',
                      aspectRatio: '210 / 297',
                      maxHeight: '70vh',
                      margin: '0 auto',
                      overflow: 'hidden',
                      borderRadius: '16px',
                      border: '1px solid var(--eduact-soft4)',
                      position: 'relative',
                    }}>
                      <div
                        ref={galRef}
                        onScroll={onGalScroll}
                        onMouseEnter={() => setAutoPaused(true)}
                        onMouseLeave={() => setAutoPaused(false)}
                        style={{
                          height: '100%',
                          overflowY: 'auto',
                          scrollSnapType: 'y mandatory',
                          scrollbarWidth: 'none',
                          msOverflowStyle: 'none',
                        }}
                      >
                        {(m.images && m.images.length ? m.images : [null]).map((src, idx) => (
                          <div
                            key={idx}
                            style={{
                              height: '100%',
                              flexShrink: 0,
                              scrollSnapAlign: 'start',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'var(--eduact-soft2)',
                              overflow: 'hidden',
                            }}
                          >
                            {src ? (
                              <button
                                type="button"
                                className="mou-gal-open"
                                onClick={() => openLightbox(idx)}
                                aria-label={`View image ${idx + 1}${galCount > 1 ? ` of ${galCount}` : ''} full size`}
                              >
                                <img src={src} alt={`${m.name} ${idx + 1}`} />
                                <span className="mou-gal-hint">
                                  <Icon name="maximize" size={13} strokeWidth={2} />
                                  Click to enlarge
                                </span>
                              </button>
                            ) : (
                              <div style={{
                                textAlign: 'center',
                                padding: '0 20px',
                                color: 'var(--eduact-grey)',
                              }}>
                                <div style={{
                                  width: '52px',
                                  height: '52px',
                                  borderRadius: '50%',
                                  background: 'rgba(23, 42, 70,0.08)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  margin: '0 auto 14px',
                                  fontSize: '22px',
                                  color: 'var(--eduact-base)',
                                }}>🖼️</div>
                                <strong style={{
                                  display: 'block',
                                  color: 'var(--eduact-black)',
                                  fontSize: '0.98rem',
                                  fontWeight: 700,
                                  marginBottom: '4px',
                                }}>{m.name}</strong>
                                <span style={{ fontSize: '0.84rem' }}>Image {idx + 1}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {galCount > 1 && (
                      <>
                        <span style={{
                          position: 'absolute',
                          top: '10px',
                          left: '12px',
                          zIndex: 2,
                          background: 'rgba(23, 42, 70,0.75)',
                          color: '#fff',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '999px',
                          letterSpacing: '0.04em',
                        }}>
                          {activeImg + 1} / {galCount}
                        </span>
                        <button
                          onClick={() => scrollGal(activeImg - 1)}
                          disabled={activeImg === 0}
                          aria-label="Previous image"
                          style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            border: 'none',
                            background: 'rgba(23, 42, 70,0.85)',
                            color: '#fff',
                            fontSize: '15px',
                            cursor: activeImg === 0 ? 'default' : 'pointer',
                            opacity: activeImg === 0 ? 0.4 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 2,
                            transition: 'opacity 0.2s ease',
                          }}
                        >▲</button>
                        <button
                          onClick={() => scrollGal(activeImg + 1)}
                          disabled={activeImg === galCount - 1}
                          aria-label="Next image"
                          style={{
                            position: 'absolute',
                            bottom: '10px',
                            right: '10px',
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            border: 'none',
                            background: 'rgba(23, 42, 70,0.85)',
                            color: '#fff',
                            fontSize: '15px',
                            cursor: activeImg === galCount - 1 ? 'default' : 'pointer',
                            opacity: activeImg === galCount - 1 ? 0.4 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 2,
                            transition: 'opacity 0.2s ease',
                          }}
                        >▼</button>
                        <div style={{
                          position: 'absolute',
                          bottom: '10px',
                          left: '12px',
                          display: 'flex',
                          gap: '6px',
                          zIndex: 2,
                        }}>
                          {(m.images || []).map((_, dIdx) => (
                            <button
                              key={dIdx}
                              onClick={() => scrollGal(dIdx)}
                              aria-label={`Go to image ${dIdx + 1}`}
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                border: 'none',
                                padding: 0,
                                background: dIdx === activeImg ? 'var(--eduact-secondary)' : 'rgba(255,255,255,0.7)',
                                cursor: 'pointer',
                                transition: 'background 0.2s ease',
                              }}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </Col>
              </Row>
            </Modal.Body>

            <Modal.Footer style={{ border: 'none', padding: '0 32px 28px' }}>
              <button className="btn-eduact" onClick={() => setShowModal(false)}>Close</button>
            </Modal.Footer>
          </>
        )}
      </Modal>

      {/* Full-size image viewer, stacked over the detail modal. */}
      <Modal
        show={lightbox && !!m?.images?.[lightboxIdx]}
        onHide={closeLightbox}
        centered
        size="xl"
        className="mou-lightbox"
        backdropClassName="mou-lightbox-backdrop"
        aria-label={`${m?.name || 'MOU'} image viewer`}
      >
        {m?.images?.[lightboxIdx] ? (
          <>
            <div className="mou-lightbox__stage">
              <button
                type="button"
                className="mou-lightbox__close"
                onClick={closeLightbox}
                aria-label="Close image viewer"
              >
                ×
              </button>

              {galCount > 1 && (
                <button
                  type="button"
                  className="mou-lightbox__nav mou-lightbox__nav--prev"
                  onClick={() => stepLightbox(-1)}
                  aria-label="Previous image"
                >
                  ‹
                </button>
              )}

              <img
                src={m.images[lightboxIdx]}
                alt={`${m.name} - image ${lightboxIdx + 1} of ${galCount}`}
              />

              {galCount > 1 && (
                <button
                  type="button"
                  className="mou-lightbox__nav mou-lightbox__nav--next"
                  onClick={() => stepLightbox(1)}
                  aria-label="Next image"
                >
                  ›
                </button>
              )}
            </div>

            <div className="mou-lightbox__bar">
              <span className="mou-lightbox__count">
                {lightboxIdx + 1} / {galCount}
              </span>
              <span className="mou-lightbox__name">{m.name}</span>

              {galCount > 1 && (
                <div className="mou-lightbox__dots">
                  {m.images.map((_, dIdx) => (
                    <button
                      key={dIdx}
                      type="button"
                      className={dIdx === lightboxIdx ? 'is-active' : ''}
                      onClick={() => setLightboxIdx(dIdx)}
                      aria-label={`Go to image ${dIdx + 1}`}
                      aria-current={dIdx === lightboxIdx}
                    />
                  ))}
                </div>
              )}

              {galCount > 1 && (
                <p className="mou-lightbox__hintkeys">
                  Use the arrow keys to move between images, Esc to close.
                </p>
              )}
            </div>
          </>
        ) : null}
      </Modal>

      <style>{`
        @media (max-width: 575px) {
          ul.mou-section-list {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
