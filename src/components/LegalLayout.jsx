import { Container } from 'react-bootstrap';
import PageHero from './PageHero';

export default function LegalLayout({ title, eyebrow, updated, children }) {
  return (
    <>
      <PageHero padding="60px 0 70px">
        <span className="eyebrow">{eyebrow}</span>
        <h1 style={{
          fontFamily: 'var(--heading-font)',
          fontWeight: 800,
          color: '#fff',
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          marginTop: '10px',
        }}>{title}</h1>
        {updated && <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '10px', fontSize: '13px' }}>Last updated: {updated}</p>}
      </PageHero>
      <Container className="page-section">
        <div className="eduact-card" style={{ padding: '36px', maxWidth: '820px' }}>
          {children}
        </div>
      </Container>
    </>
  );
}
