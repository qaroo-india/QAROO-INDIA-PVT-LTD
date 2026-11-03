import Seo from '../components/Seo.jsx';
import LegalLayout from '../components/LegalLayout.jsx';
import { COMPANY } from '../data/company.js';
import { mailtoHref } from '../utils/mailto.js';

export default function Terms() {
  return (
    <>
      <Seo
        title="Terms of Use - Qaroo India Private Limited"
        description="Terms of Use for the Qaroo India Private Limited website. Please read these terms before using our services."
        path="/terms"
      />
      <LegalLayout title="Terms of Use" eyebrow="Legal" updated="1 January 2026">
        <h2 style={{ fontSize: '20px', color: 'var(--eduact-base)', marginBottom: '12px' }}>1. Acceptance of Terms</h2>
        <p style={{ fontSize: '14.5px', lineHeight: 1.7, marginBottom: '20px' }}>
          By accessing the Qaroo India Private Limited website, you agree to be bound by these Terms of Use and all
          applicable laws and regulations.
        </p>

        <h2 style={{ fontSize: '20px', color: 'var(--eduact-base)', marginBottom: '12px' }}>2. Use of Services</h2>
        <p style={{ fontSize: '14.5px', lineHeight: 1.7, marginBottom: '20px' }}>
          Information on this website is provided for general informational purposes about our business solutions,
          learning programs and corporate social responsibility work. We may update content at any time without notice.
        </p>

        <h2 style={{ fontSize: '20px', color: 'var(--eduact-base)', marginBottom: '12px' }}>3. Intellectual Property</h2>
        <p style={{ fontSize: '14.5px', lineHeight: 1.7, marginBottom: '20px' }}>
          All content on this website, including text, graphics, logos and branding, is the property of Qaroo India
          Private Limited and may not be reproduced without prior written consent.
        </p>

        <h2 style={{ fontSize: '20px', color: 'var(--eduact-base)', marginBottom: '12px' }}>4. Limitation of Liability</h2>
        <p style={{ fontSize: '14.5px', lineHeight: 1.7, marginBottom: '20px' }}>
          Qaroo India Private Limited will not be liable for any loss or damage arising from your use of this website
          or reliance on the information it contains.
        </p>

        <h2 style={{ fontSize: '20px', color: 'var(--eduact-base)', marginBottom: '12px' }}>5. Contact</h2>
        <p style={{ fontSize: '14.5px', lineHeight: 1.7 }}>
          For questions about these terms, contact us at{' '}
          <a href={mailtoHref(COMPANY.email)} style={{ color: 'var(--eduact-base)', fontWeight: 600 }}>{COMPANY.email}</a>.
        </p>
      </LegalLayout>
    </>
  );
}
