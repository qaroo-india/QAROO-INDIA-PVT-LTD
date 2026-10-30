import { useState, useEffect } from 'react';
import { safeHref } from '../utils/safeHref.js';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { COMPANY } from '../data/company.js';
import { contentApi } from '../api/contentApi.js';
import { mailtoHref } from '../utils/mailto.js';

const DEFAULT_FOOTER = {
  brandName: COMPANY.name,
  tagline: 'Business solutions and career-ready learning, from One Team in Tamil Nadu.',
  email: COMPANY.email,
  phones: [...COMPANY.phones],
  socials: [
    { platform: 'instagram', url: '' },
    { platform: 'linkedin', url: '' },
    { platform: 'facebook', url: '' },
    { platform: 'youtube', url: '' },
    { platform: 'email', url: '' },
  ],
    copyright: 'All rights reserved.',
  businessLinks: [
    { label: 'CRM Solutions', path: '/business-solutions' },
    { label: 'Digital Marketing', path: '/business-solutions' },
    { label: 'Graphic Design', path: '/business-solutions' },
    { label: 'Web Development', path: '/business-solutions' },
    { label: 'Software Development', path: '/business-solutions' },
    { label: 'UI/UX & UX Research', path: '/business-solutions' },
    { label: 'Business Strategy', path: '/business-solutions' },
  ],
  learningLinks: [
    { label: 'Data Science & Analytics', path: '/learning-programs' },
    { label: 'Full Stack Development', path: '/learning-programs' },
    { label: 'UI/UX Design', path: '/learning-programs' },
    { label: 'Cyber Security', path: '/learning-programs' },
    { label: 'AI & Machine Learning', path: '/learning-programs' },
    { label: 'Graphic Design & Animation', path: '/learning-programs' },
    { label: 'Software Testing', path: '/learning-programs' },
  ],
  offices: COMPANY.offices.map((o) => ({ ...o })),
};

const SOCIAL_SVG = {
  instagram: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  linkedin: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  ),
  facebook: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  ),
  youtube: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.43z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
    </svg>
  ),
  email: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 7l-10 7L2 7" />
    </svg>
  ),
};

function SocialIcon({ platform, url }) {
  const href = platform === 'email' ? mailtoHref(url) : safeHref(url);
  const icon = SOCIAL_SVG[platform];
  if (!icon || !url) return null;
  return (
    <a
      href={href}
      target={platform !== 'email' ? '_blank' : undefined}
      rel={platform !== 'email' ? 'noopener noreferrer' : undefined}
      aria-label={platform}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '38px',
        height: '38px',
        borderRadius: '10px',
        background: 'rgba(255,255,255,0.08)',
        color: 'rgba(255,255,255,0.7)',
        transition: 'background-color 0.18s ease, color 0.18s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--eduact-secondary)'; e.currentTarget.style.color = '#fff'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
    >
      {icon}
    </a>
  );
}

const officeLines = (office) =>
  Array.isArray(office.lines)
    ? office.lines
    : String(office.lines || '').split('\n').map((s) => s.trim()).filter(Boolean);

export default function Footer() {
  const [cfg, setCfg] = useState(DEFAULT_FOOTER);

  useEffect(() => {
    contentApi.get('footer', { credentials: 'omit' }).then((res) => {
      const d = res?.data?.content?.data;
      if (d && Object.keys(d).length) {
        setCfg((prev) => ({ ...prev, ...d }));
      }
    }).catch(() => {});
  }, []);

  const socials = (cfg.socials || []).filter((s) => s && s.url);

  return (
    <footer style={{
      background: 'var(--eduact-black)',
      color: 'rgba(255,255,255,0.6)',
      padding: '64px 0 28px',
      borderTop: '1px solid rgba(255,255,255,0.08)',
    }}>
      <Container>
        <Row className="g-4" style={{ marginBottom: '48px' }}>
          <Col lg={4} md={6}>
            <Link to="/admin/login" aria-label="Admin login" style={{ display: 'inline-block', lineHeight: 0 }}>
              <span style={{ display: 'inline-block', background: '#fff', borderRadius: '10px', padding: '8px 12px', marginBottom: '16px', lineHeight: 0 }}>
                <img
                  src="/logos/qaroo-logo.png"
                  alt={cfg.brandName}
                  width="472"
                  height="132"
                  style={{ height: '40px', width: 'auto', objectFit: 'contain', display: 'block' }}
                />
              </span>
            </Link>
            <h5 style={{
              fontFamily: 'var(--heading-font)',
              fontWeight: 700,
              fontSize: '12px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#fff',
              marginBottom: '16px',
            }}>{cfg.brandName}</h5>
            <p style={{ fontSize: '13.5px', marginBottom: '10px' }}>
              {cfg.tagline}
            </p>
            {cfg.email && (
              <p style={{ fontSize: '13.5px', marginBottom: '10px' }}>
                <a href={mailtoHref(cfg.email)} style={{ color: 'var(--eduact-secondary)', fontWeight: 600, textDecoration: 'none' }}
                  onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}>
                  {cfg.email}
                </a>
              </p>
            )}
            {(cfg.phones || []).length > 0 && (
              <p style={{ fontSize: '13.5px', marginBottom: '10px', color: '#fff' }}>
                {cfg.phones.map((p, i) => (
                  <a key={p} href={`tel:${String(p).replace(/[^+\d]/g, '')}`} style={{
                    color: 'var(--eduact-secondary)',
                    fontWeight: 700,
                    textDecoration: 'none',
                    marginRight: i < cfg.phones.length - 1 ? '12px' : '0',
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}>
                    {p}
                  </a>
                ))}
              </p>
            )}
            {socials.length > 0 && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
                {socials.map((s) => (
                  <SocialIcon key={s.platform} platform={s.platform} url={s.url} />
                ))}
              </div>
            )}
          </Col>

          <Col lg={2} md={6}>
            <h5 style={{
              fontFamily: 'var(--heading-font)',
              fontWeight: 700,
              fontSize: '12px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#fff',
              marginBottom: '16px',
            }}>Business Solutions</h5>
            {(cfg.businessLinks || []).map((item) => (
              <Link key={item.label} to={item.path} style={{
                display: 'block',
                fontSize: '13.5px',
                color: '#D1D5DB',
                marginBottom: '10px',
                transition: 'color 0.15s',
              }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--eduact-secondary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#D1D5DB'}
              >{item.label}</Link>
            ))}
          </Col>

          <Col lg={2} md={6}>
            <h5 style={{
              fontFamily: 'var(--heading-font)',
              fontWeight: 700,
              fontSize: '12px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#fff',
              marginBottom: '16px',
            }}>Learning</h5>
            {(cfg.learningLinks || []).map((item) => (
              <Link key={item.label} to={item.path} style={{
                display: 'block',
                fontSize: '13.5px',
                color: '#D1D5DB',
                marginBottom: '10px',
                transition: 'color 0.15s',
              }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--eduact-secondary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#D1D5DB'}
              >{item.label}</Link>
            ))}
          </Col>

          {(cfg.offices || []).map((office, i) => (
            <Col lg={Math.max(2, Math.floor(4 / Math.max(1, (cfg.offices || []).length)))} md={6} key={office.title || i}>
              <h5 style={{
                fontFamily: 'var(--heading-font)',
                fontWeight: 700,
                fontSize: '12px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#fff',
                marginBottom: '16px',
              }}>{office.title}</h5>
              {officeLines(office).map((line) => (
                <p key={line} style={{ fontSize: '13.5px', marginBottom: '10px', color: 'rgba(255,255,255,0.75)' }}>
                  {line}
                </p>
              ))}
              {office.phone && (
                <p style={{ fontSize: '13.5px', marginBottom: '10px' }}>
                  <a href={`tel:${String(office.phone).replace(/[^+\d]/g, '')}`} style={{ color: 'var(--eduact-secondary)', fontWeight: 700, textDecoration: 'none' }}
                    onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}>{office.phone}</a>
                </p>
              )}
            </Col>
          ))}
        </Row>

        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '12.5px',
          color: 'rgba(255,255,255,0.5)',
        }}>
          <span>&copy; 2026 <span style={{ color: '#fff', fontWeight: 600 }}>{cfg.brandName}</span> {cfg.copyright ? `- ${cfg.copyright}` : '. All rights reserved.'}</span>
          <span>
            <Link to="/privacy-policy" style={{ color: 'inherit', textDecoration: 'none', marginRight: '10px' }}>Privacy Policy</Link>
            <Link to="/terms" style={{ color: 'inherit', textDecoration: 'none', marginRight: '10px' }}>Terms</Link>
            <Link to="/sitemap" style={{ color: 'inherit', textDecoration: 'none' }}>Sitemap</Link>
          </span>
        </div>
      </Container>
    </footer>
  );
}
