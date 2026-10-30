import { Link } from 'react-router-dom';
import Seo from '../components/Seo.jsx';
import LegalLayout from '../components/LegalLayout.jsx';

export default function SitemapPage() {
  const links = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About Us' },
    { to: '/business-solutions', label: 'Business Solutions' },
    { to: '/learning-programs', label: 'Learning Programs' },
    { to: '/careers', label: 'Careers' },
    { to: '/csr-projects', label: 'CSR Projects' },
    { to: '/mou-directory', label: 'MOU Directory' },
    { to: '/contact', label: 'Contact Us' },
    { to: '/privacy-policy', label: 'Privacy Policy' },
    { to: '/terms', label: 'Terms of Use' },
  ];
  return (
    <>
      <Seo
        title="Sitemap - Qaroo India Private Limited"
        description="Sitemap of the Qaroo India Private Limited website. Browse all pages including business solutions, learning programs, CSR projects and MOU directory."
        path="/sitemap"
      />
      <LegalLayout title="Sitemap" eyebrow="Navigation">
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '12px' }}>
          {links.map((l) => (
            <li key={l.to}>
              <Link to={l.to} style={{ fontSize: '15px', color: 'var(--eduact-base)', fontWeight: 600, textDecoration: 'none' }}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </LegalLayout>
    </>
  );
}
