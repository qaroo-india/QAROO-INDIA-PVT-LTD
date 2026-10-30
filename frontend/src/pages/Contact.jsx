import { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Form } from 'react-bootstrap';
import Seo from '../components/Seo.jsx';
import { useToast } from '../context/ToastContext';
import { contactApi } from '../api/contactApi.js';
import { contentApi } from '../api/contentApi.js';
import { mailtoHref } from '../utils/mailto.js';
import { COMPANY } from '../data/company.js';
import PageHero from '../components/PageHero';

const DEFAULT_CONTACT = {
  offices: COMPANY.offices.map((o) => ({ ...o, lines: [...o.lines] })),
  contact: { email: COMPANY.email, phones: [...COMPANY.phones, COMPANY.chennaiPhone] },
  hours: { ...COMPANY.hours },
};

// Choosing an interest reveals a tightening, per-category follow-up field.
// The answer rides into the `subject` field of the message record, alongside
// the broad `interest` choice — grouping enquiries for the admin.
const INTEREST_FIELDS = {
  business: [
    { name: 'subject', type: 'text', label: 'Company name', placeholder: 'e.g. Acme Corp Pvt Ltd' },
  ],
  learning: [
    { name: 'subject', type: 'text', label: 'Qualification', placeholder: 'e.g. B.E. in Computer Science (2024)' },
  ],
  csr: [
    { name: 'subject', type: 'select', label: 'Partnership type', options: ['Workforce readiness', 'Education access', 'Digital empowerment', 'Institutional partnership'] },
  ],
};

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    interest: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState(DEFAULT_CONTACT);
  const toast = useToast();
  const submitTimer = useRef(null);

  useEffect(() => {
    return () => {
      if (submitTimer.current) {
        clearTimeout(submitTimer.current);
        submitTimer.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let active = true;
    contentApi
      .get('contact', { credentials: 'omit' })
      .then((res) => {
        if (active && res?.data?.content?.data) {
          setContent({ ...DEFAULT_CONTACT, ...res.data.content.data });
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // A new interest invalidates any previous per-category answer.
      ...(name === 'interest' ? { subject: '' } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      await contactApi.submit(formData);
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', interest: '', subject: '', message: '' });
      toast.success("Message sent. We'll get back to you within 24 hours.");
      if (submitTimer.current) clearTimeout(submitTimer.current);
      submitTimer.current = setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
      toast.error(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const offices = content.offices || [];
  const contactInfo = content.contact || {};
  const hours = content.hours || {};
  const phones = contactInfo.phones || [];

  return (
    <>
      <Seo
        title="Contact Us - Qaroo India Private Limited | Coimbatore & Chennai Offices"
        description={`Contact Qaroo India Private Limited. Head office in Coimbatore, branch office in Chennai. Call ${COMPANY.primaryPhone} or email ${COMPANY.email} for business solutions, learning programs and CSR partnerships.`}
        path="/contact"
      />
      <PageHero padding="80px 0 100px">
        <span className="eyebrow">Contact Us</span>
        <h1 style={{
          fontFamily: 'var(--heading-font)',
          fontWeight: 800,
          color: '#fff',
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          marginTop: '10px',
        }}>Let's start a conversation.</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '560px', marginTop: '14px' }}>
          Whether you need business solutions or want to explore learning programs, we're here to help.
        </p>
      </PageHero>

      <Container className="page-section">
        <Row className="g-5">
          <Col lg={7}>
            <div className="reveal">
              <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>Send us a message</h2>
              {submitted ? (
                <div style={{
                  background: 'rgba(244, 196, 48,0.15)',
                  border: '1px solid var(--eduact-secondary)',
                  borderRadius: '14px',
                  padding: '24px',
                  textAlign: 'center',
                }}>
                  <h4 style={{ color: 'var(--eduact-base)' }}>Thank you!</h4>
                  <p style={{ color: 'var(--eduact-text)', margin: 0 }}>We'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <Form onSubmit={handleSubmit}>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group controlId="contact-name">
                        <Form.Label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--eduact-black)' }}>Full Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          style={{
                            borderRadius: '12px',
                            border: '1px solid var(--eduact-soft4)',
                            padding: '12px 16px',
                            fontSize: '14px',
                          }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="contact-email">
                        <Form.Label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--eduact-black)' }}>Email</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          style={{
                            borderRadius: '12px',
                            border: '1px solid var(--eduact-soft4)',
                            padding: '12px 16px',
                            fontSize: '14px',
                          }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="contact-phone">
                        <Form.Label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--eduact-black)' }}>Phone</Form.Label>
                        <Form.Control
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          style={{
                            borderRadius: '12px',
                            border: '1px solid var(--eduact-soft4)',
                            padding: '12px 16px',
                            fontSize: '14px',
                          }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="contact-interest">
                        <Form.Label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--eduact-black)' }}>I'm interested in</Form.Label>
                        <Form.Select
                          name="interest"
                          value={formData.interest}
                          onChange={handleChange}
                          required
                          style={{
                            borderRadius: '12px',
                            border: '1px solid var(--eduact-soft4)',
                            padding: '12px 16px',
                            fontSize: '14px',
                          }}
                        >
                          <option value="">Select an option</option>
                          <option value="business">Business Solutions</option>
                          <option value="learning">Learning Programs</option>
                          <option value="csr">CSR Partnership</option>
                          <option value="other">Other</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    {INTEREST_FIELDS[formData.interest] ? INTEREST_FIELDS[formData.interest].map((field) => (
                      <Col xs={12} key={field.name}>
                        {/* Keyed off the field, because this group renders once
                            per conditional field and a shared id would collide. */}
                        <Form.Group controlId={`contact-${field.name}-${field.label.replace(/\W+/g, '-').toLowerCase()}`}>
                          <Form.Label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--eduact-black)' }}>
                            {field.label}
                          </Form.Label>
                          {field.type === 'select' ? (
                            <Form.Select
                              name="subject"
                              value={formData.subject}
                              onChange={handleChange}
                              required
                              style={{
                                borderRadius: '12px',
                                border: '1px solid var(--eduact-soft4)',
                                padding: '12px 16px',
                                fontSize: '14px',
                              }}
                            >
                              <option value="">Select...</option>
                              {field.options.map((o) => (
                                <option key={o} value={o}>{o}</option>
                              ))}
                            </Form.Select>
                          ) : (
                            <Form.Control
                              type={field.type}
                              name={field.name}
                              value={formData[field.name]}
                              onChange={handleChange}
                              placeholder={field.placeholder}
                              required
                              style={{
                                borderRadius: '12px',
                                border: '1px solid var(--eduact-soft4)',
                                padding: '12px 16px',
                                fontSize: '14px',
                              }}
                            />
                          )}
                        </Form.Group>
                      </Col>
                    )) : null}
                    <Col xs={12}>
                      <Form.Group controlId="contact-message">
                        <Form.Label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--eduact-black)' }}>Message</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={4}
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          style={{
                            borderRadius: '12px',
                            border: '1px solid var(--eduact-soft4)',
                            padding: '12px 16px',
                            fontSize: '14px',
                          }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <div className="mt-4">
                    {error && (
                      <p style={{ color: 'var(--eduact-base)', fontSize: '13px', marginBottom: '12px' }}>{error}</p>
                    )}
                    <button
                      type="submit"
                      className="btn-eduact no-hover-scale"
                      disabled={sending}
                      style={{
                        border: 'none',
                        cursor: sending ? 'not-allowed' : 'pointer',
                        opacity: sending ? 0.7 : 1,
                        minWidth: 150,
                        width: '100%',
                        justifyContent: 'center',
                      }}
                    >
                      {sending ? 'Sending...' : 'Send Message'}
                    </button>
                  </div>
                </Form>
              )}
            </div>
          </Col>

          <Col lg={5}>
            <div className="reveal">
              <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>Get in touch</h2>

              {offices.map((office) => (
                <div key={office.title} className="eduact-card mb-3" style={{ borderLeft: '4px solid var(--eduact-base)' }}>
                  <h4 style={{ fontSize: '16px', marginBottom: '8px', color: 'var(--eduact-base)' }}>{office.title}</h4>
                  <p style={{ fontSize: '14px', margin: 0, color: 'var(--eduact-text)' }}>
                    {office.lines.map((line) => (
                      <span key={line}>{line}<br /></span>
                    ))}
                  </p>
                  {office.title.toLowerCase().includes('head office') && (
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=Qaroo+India+Private+Limited+P+N+Palayam+Coimbatore"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-eduact-outline"
                      style={{ marginTop: '12px', fontSize: '13px', padding: '9px 18px' }}
                    >
                      Click to find us
                    </a>
                  )}
                </div>
              ))}

              <div className="eduact-card mb-3">
                <h4 style={{ fontSize: '16px', marginBottom: '8px', color: 'var(--eduact-base)' }}>Contact</h4>
                <p style={{ fontSize: '14px', margin: 0, color: 'var(--eduact-text)' }}>
                  {contactInfo.email && (
                    <>
                      <strong style={{ color: 'var(--eduact-black)' }}>Email:</strong>{' '}
                      <a href={mailtoHref(contactInfo.email)} style={{ color: 'var(--eduact-base)', fontWeight: 600, textDecoration: 'none' }}
                        onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}>
                        {contactInfo.email}
                      </a><br />
                    </>
                  )}
                  {phones.map((phone) => (
                    <span key={phone}>
                      <strong style={{ color: 'var(--eduact-black)' }}>Phone:</strong>{' '}
                      <a href={`tel:${phone.replace(/[^0-9]/g, '')}`} style={{ color: 'var(--eduact-base)', fontWeight: 700, textDecoration: 'none' }}
                        onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}>
                        {phone}
                      </a><br />
                    </span>
                  ))}
                </p>
              </div>

              {hours.days && (
                <div className="eduact-card">
                  <h4 style={{ fontSize: '16px', marginBottom: '8px', color: 'var(--eduact-base)' }}>Business Hours</h4>
                  <p style={{ fontSize: '14px', margin: 0, color: 'var(--eduact-text)' }}>
                    {hours.days}<br />
                    {hours.time}
                  </p>
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Container>
    </>
  );
}
