import { useState } from 'react';
import { Row, Col, Form } from 'react-bootstrap';
import Icon from '../../components/Icon';
import { applicationApi } from '../../api/applicationApi.js';

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const ACCEPT = '.pdf,.doc,.docx';
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const EMPTY = {
  name: '',
  fatherName: '',
  phone: '',
  parentMobile: '',
  email: '',
  address: '',
  experience: '',
  qualification: '',
};

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read that file'));
    reader.readAsDataURL(file);
  });

/**
 * Application form for one specific vacancy.
 *
 * The role is identified by slug and resolved server-side, so an application is
 * always attached to a real published posting rather than to whatever the form
 * claims. The application date is not a field - it comes from when the record
 * is created. The resume is a file upload; the server stores it and only an
 * admin with the right permission can download it.
 */
export default function ApplyForm({ jobSlug, jobTitle }) {
  const [form, setForm] = useState(EMPTY);
  const [declared, setDeclared] = useState(false);
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const pickFile = (e) => {
    const next = e.target.files?.[0] || null;
    setFileError('');
    if (!next) {
      setFile(null);
      return;
    }
    // Checked here for immediate feedback; the server re-checks type and size,
    // since a client-side check is a convenience and never a control.
    if (!ALLOWED_TYPES.includes(next.type)) {
      setFileError('Please attach a PDF or Word document.');
      setFile(null);
      e.target.value = '';
      return;
    }
    if (next.size > MAX_RESUME_BYTES) {
      setFileError('That file is over 5MB. Please attach a smaller file.');
      setFile(null);
      e.target.value = '';
      return;
    }
    setFile(next);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError('Please enter your name, email and mobile number.');
      return;
    }
    if (!declared) {
      setError('Please accept the declaration before submitting.');
      return;
    }

    setSending(true);
    try {
      const payload = { ...form, jobSlug, declaration: true };
      if (file) {
        payload.resumeFile = await fileToBase64(file);
        payload.resumeName = file.name;
      }
      await applicationApi.submit(payload);
      setSent(true);
      setForm(EMPTY);
      setDeclared(false);
      setFile(null);
    } catch (err) {
      setError(err?.message || 'We could not submit your application. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="apply-done" role="status">
        <Icon name="check-circle" size={34} strokeWidth={1.6} />
        <h3>Application received</h3>
        <p>
          Thank you for applying{jobTitle ? ` for ${jobTitle}` : ''}. Our team will review your
          application and get back to you.
        </p>
        <button type="button" className="btn-eduact-outline" onClick={() => setSent(false)}>
          Submit another application
        </button>
      </div>
    );
  }

  return (
    <form className="apply-form" onSubmit={submit} noValidate>
      <Row className="g-3">
        <Col md={6}>
          <Form.Group controlId="apply-name">
            <Form.Label>
              Name <span aria-hidden="true">*</span>
            </Form.Label>
            <Form.Control name="name" value={form.name} onChange={change} required />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group controlId="apply-father">
            <Form.Label>Father&apos;s name</Form.Label>
            <Form.Control name="fatherName" value={form.fatherName} onChange={change} />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group controlId="apply-phone">
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
          <Form.Group controlId="apply-parent-phone">
            <Form.Label>Parent mobile number</Form.Label>
            <Form.Control
              type="tel"
              name="parentMobile"
              value={form.parentMobile}
              onChange={change}
              inputMode="tel"
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group controlId="apply-email">
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
          <Form.Group controlId="apply-qualification">
            <Form.Label>Qualification</Form.Label>
            <Form.Control
              name="qualification"
              value={form.qualification}
              onChange={change}
              placeholder="e.g. B.E Computer Science, 2025"
            />
          </Form.Group>
        </Col>

        <Col xs={12}>
          <Form.Group controlId="apply-address">
            <Form.Label>Address</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="address"
              value={form.address}
              onChange={change}
            />
          </Form.Group>
        </Col>

        <Col xs={12}>
          <Form.Group controlId="apply-experience">
            <Form.Label>Work experience</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="experience"
              value={form.experience}
              onChange={change}
              placeholder="Fresher, or your previous roles and how long you were in them"
            />
          </Form.Group>
        </Col>

        <Col xs={12}>
          <Form.Group controlId="apply-resume">
            <Form.Label>Resume</Form.Label>
            <Form.Control type="file" accept={ACCEPT} onChange={pickFile} />
            {file ? <span className="apply-file">Attached: {file.name}</span> : null}
            {fileError ? (
              <span className="apply-error" role="alert">
                {fileError}
              </span>
            ) : (
              <span className="apply-hint">PDF or Word document, up to 5MB.</span>
            )}
          </Form.Group>
        </Col>
      </Row>

      <div className="apply-declaration">
        <Form.Check
          type="checkbox"
          id="apply-declaration"
          checked={declared}
          onChange={(e) => setDeclared(e.target.checked)}
          label={
            <>
              I declare that the information given above is true and correct to the best of my
              knowledge, and I consent to Qaroo India Private Limited holding these details for
              recruitment purposes. <span aria-hidden="true">*</span>
            </>
          }
        />
      </div>

      {error ? (
        <p className="apply-error" role="alert">
          {error}
        </p>
      ) : null}

      <button type="submit" className="btn-eduact no-hover-scale" disabled={sending || !declared}>
        {sending ? 'Submitting...' : 'Submit Application'}
        {!sending && <Icon name="arrow-right" size={16} strokeWidth={2} />}
      </button>
    </form>
  );
}
