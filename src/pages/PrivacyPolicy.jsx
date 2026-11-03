import Seo from '../components/Seo.jsx';
import LegalLayout from '../components/LegalLayout.jsx';
import { COMPANY } from '../data/company.js';
import { mailtoHref } from '../utils/mailto.js';

export default function PrivacyPolicy() {
  return (
    <>
      <Seo
        title="Privacy Policy - Qaroo India Private Limited"
        description="Privacy Policy for Qaroo India Private Limited. Learn how we collect, use and protect your personal information."
        path="/privacy-policy"
      />
      <LegalLayout title="Privacy Policy" eyebrow="Legal" updated="1 January 2026">
        <h2 style={{ fontSize: '20px', color: 'var(--eduact-base)', marginBottom: '12px' }}>1. Introduction</h2>
        <p style={{ fontSize: '14.5px', lineHeight: 1.7, marginBottom: '20px' }}>
          Qaroo India Private Limited ("we", "our", "us") respects your privacy and is committed to protecting the
          personal information you share with us through this website.
        </p>

        <h2 style={{ fontSize: '20px', color: 'var(--eduact-base)', marginBottom: '12px' }}>2. Information We Collect</h2>
        <p style={{ fontSize: '14.5px', lineHeight: 1.7, marginBottom: '20px' }}>
          When you contact us, we collect the details you provide, such as your name, email address, phone number and
          the content of your message, so that we can respond to your enquiry.
        </p>

        <h2 style={{ fontSize: '20px', color: 'var(--eduact-base)', marginBottom: '12px' }}>3. How We Use Your Information</h2>
        <p style={{ fontSize: '14.5px', lineHeight: 1.7, marginBottom: '20px' }}>
          We use the information you provide to respond to enquiries, provide business solutions or learning program
          details, and improve our services. We do not sell your personal information to third parties.
        </p>

        <h2 style={{ fontSize: '20px', color: 'var(--eduact-base)', marginBottom: '12px' }}>4. Data Security</h2>
        <p style={{ fontSize: '14.5px', lineHeight: 1.7, marginBottom: '20px' }}>
          We take reasonable measures to protect your information from unauthorised access, alteration or disclosure.
        </p>

        <h2 style={{ fontSize: '20px', color: 'var(--eduact-base)', marginBottom: '12px' }}>5. Contact</h2>
        <p style={{ fontSize: '14.5px', lineHeight: 1.7 }}>
          If you have any questions about this Privacy Policy, please contact us at{' '}
          <a href={mailtoHref(COMPANY.email)} style={{ color: 'var(--eduact-base)', fontWeight: 600 }}>{COMPANY.email}</a>
          {' '}or call{' '}
          <a href={`tel:${COMPANY.primaryPhone.replace(/\s/g, '')}`} style={{ color: 'var(--eduact-base)', fontWeight: 700 }}>{COMPANY.primaryPhone}</a>.
        </p>
      </LegalLayout>
    </>
  );
}
