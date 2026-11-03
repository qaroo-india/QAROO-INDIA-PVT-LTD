import { useState } from 'react';
import { Modal, Row, Col, Form } from 'react-bootstrap';
import Icon from './Icon';
import { contactApi } from '../api/contactApi.js';
import { downloadBrochure } from '../utils/downloadBrochure.js';
import './BrochureGate.css';

/**
 * Collects a visitor's details before handing over a programme brochure.
 *
 * The request goes through the same endpoint as the contact form, tagged with
 * `source: 'brochure'`, so these land in the one inbox the team already works
 * from rather than somewhere nobody checks.
 *
 * The document itself is delivered one of two ways. If a real PDF has been
 * published at `/brochures/<group>/<slug>.pdf` it is downloaded as-is.
 * Otherwise the brochure is built from the record's own content and opened in a
 * print window, where the browser's own "Save as PDF" produces the file - no
 * PDF library, and nothing invented that the page does not already say.
 *
 * The group matters: `digital-marketing` and `ui-ux-design` each exist as BOTH a
 * learning programme and a business solution, so a single flat folder keyed on
 * the slug would hand a visitor the wrong document on two pages of each section.
 *
 * @param {object} props
 * @param {boolean} props.show
 * @param {() => void} props.onHide
 * @param {string} props.title record name, shown and recorded
 * @param {string} [props.slug] used to look for a published PDF
 * @param {'learning'|'business'} [props.group] which folder to look in
 * @param {string} [props.href] the record's own brochure path, preferred over
 *   the slug convention - this is what the seeded `brochure` field supplies
 * @param {string} [props.subtitle] sub-heading for the generated brochure
 * @param {Array} [props.sections] body of the generated brochure
 */
export default function BrochureGate({ show, onHide, title, slug, group, href, subtitle, sections }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', city: '' });
  const [agreed, setAgreed] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const deliver = async () => {
    // A published PDF wins over the generated document. HEAD rather than GET
    // so a missing file costs nothing, and any failure just falls through.
    // The record's own path first - it is the one the database holds - then the
    // folder convention, then the old flat layout.
    const candidates = [
      href,
      group && slug ? `/brochures/${group}/${slug}.pdf` : null,
      slug ? `/brochures/${slug}.pdf` : null,
    ].filter(Boolean);
    for (const candidate of candidates) {
      try {
        // The content type is checked as well as the status: the SPA fallback
        // answers a missing file with index.html and a 200, so `ok` alone
        // would hand the visitor a web page named .pdf.
        const res = await fetch(candidate, { method: 'HEAD' });
        if (res.ok && (res.headers.get('content-type') || '').includes('pdf')) {
          const link = document.createElement('a');
          link.href = candidate;
          link.download = `Qaroo-${title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-')}-Brochure.pdf`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          return;
        }
      } catch {
        /* try the next candidate, then the generated brochure */
      }
    }
    downloadBrochure({ title, subtitle, sections, print: true });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError('Please enter your name, email and phone number.');
      return;
    }
    if (!agreed) {
      setError('Please accept the declaration before downloading.');
      return;
    }

    setSending(true);
    try {
      await contactApi.submit({
        ...form,
        source: 'brochure',
        resource: title,
        interest: title,
        subject: `Brochure download: ${title}`,
        message: `Requested the ${title} brochure.${form.city ? ` City: ${form.city}.` : ''}`,
      });
      setDone(true);
      await deliver();
    } catch (err) {
      setError(err?.message || 'We could not send that just now. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const close = () => {
    setError('');
    onHide();
  };

  return (
    <Modal show={show} onHide={close} centered className="brochure-gate">
      <Modal.Header closeButton>
        <Modal.Title className="brochure-gate__heading">
          {done ? 'Your brochure is downloading' : 'Download the brochure'}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {done ? (
          <div className="brochure-gate__done" role="status">
            <Icon name="check-circle" size={32} strokeWidth={1.6} />
            <p>
              Thank you. The <strong>{title}</strong> brochure is on its way. If the
              download did not start, use the button below.
            </p>
            <button type="button" className="btn-eduact no-hover-scale" onClick={deliver}>
              Download again
            </button>
          </div>
        ) : (
          <form className="brochure-gate__form" onSubmit={submit} noValidate>
            <p className="brochure-gate__intro">
              Tell us where to reach you and the <strong>{title}</strong> brochure is
              yours. We use these details to answer questions about the programme,
              nothing else.
            </p>

            <Row className="g-3">
              <Col md={6}>
                <Form.Group controlId="brochure-name">
                  <Form.Label>
                    Name <span aria-hidden="true">*</span>
                  </Form.Label>
                  <Form.Control name="name" value={form.name} onChange={change} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="brochure-phone">
                  <Form.Label>
                    Mobile number <span aria-hidden="true">*</span>
                  </Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={change}
                    inputMode="tel"
                    autoComplete="tel"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="brochure-email">
                  <Form.Label>
                    Email <span aria-hidden="true">*</span>
                  </Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={change}
                    autoComplete="email"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="brochure-city">
                  <Form.Label>City</Form.Label>
                  <Form.Control name="city" value={form.city} onChange={change} />
                </Form.Group>
              </Col>
            </Row>

            <div className="brochure-gate__declaration">
              <Form.Check
                type="checkbox"
                id="brochure-consent"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                label={
                  <>
                    I agree to Qaroo India Private Limited contacting me about this
                    programme. <span aria-hidden="true">*</span>
                  </>
                }
              />
            </div>

            {error ? (
              <p className="brochure-gate__error" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              className="btn-eduact no-hover-scale brochure-gate__submit"
              disabled={sending || !agreed}
            >
              {sending ? 'Preparing...' : 'Download brochure'}
              {!sending && <Icon name="arrow-right" size={16} strokeWidth={2} />}
            </button>
          </form>
        )}
      </Modal.Body>
    </Modal>
  );
}
