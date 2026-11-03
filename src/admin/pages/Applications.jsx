import { useState, useEffect, useCallback } from 'react';
import { safeHref } from '../../utils/safeHref.js';
import { Modal } from 'react-bootstrap';
import { applicationApi } from '../../api/applicationApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import PermissionGuard from '../components/PermissionGuard.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import { ShimmerPanel, EmptyState, ErrorState } from '../../components/ui/States';
import { useToast } from '../../context/ToastContext';

const STAGES = ['new', 'reviewed', 'scheduled', 'rejected'];
// 'shortlisted' only appears on records created before the stages changed, so
// it is offered in the filter dropdown but not as a settable stage.
const FILTER_STATUSES = [...STAGES, 'shortlisted'];
const BADGE = {
  new: 'green', reviewed: 'grey', scheduled: 'green', rejected: 'grey', shortlisted: 'grey',
};
const ATTENDANCE = [
  ['yes', 'Attended'],
  ['no', 'Did not attend'],
  ['', 'Not recorded'],
];
const attendanceLabel = (v) =>
  v === 'yes' ? 'Attended' : v === 'no' ? 'Did not attend' : 'Not recorded';
const COLUMNS = 6;

const when = (iso) => (iso ? new Date(iso).toLocaleString() : '-');

// Resumes are not served statically - this endpoint checks applications.read
// and streams the file. A plain link works because auth rides on the cookie.
// `inline=1` renders it in the viewer; without it the server sends it as an
// attachment, which is the only thing that downloads, and only on a click.
const resumeHref = (id, inline) => `/api/applications/${id}/resume${inline ? '?inline=1' : ''}`;
const hasResume = (a) => Boolean(a.resumeUrl || a.resumePath);
const isPdf = (a) => (a.resumeMime || '').includes('pdf') || (a.resumePath || '').endsWith('.pdf');

export default function Applications() {
  const { hasPermission } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  // Typed immediately, applied 400ms later so a long run of keystrokes does not
  // fire a request per character.
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState('all');
  const [role, setRole] = useState('all');
  const [roleOptions, setRoleOptions] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  // Both popups hold an id rather than the record itself, so an open modal
  // re-reads from the refreshed list after a status change instead of showing
  // the copy it was opened with.
  const [detailId, setDetailId] = useState(null);
  const [resumeId, setResumeId] = useState(null);
  // Remarks are typed then saved explicitly, so a half-written note is never
  // persisted and the table does not refetch on every keystroke.
  const [remarks, setRemarks] = useState('');
  const [savingRemarks, setSavingRemarks] = useState(false);
  const toast = useToast();
  // Moving an application off 'new', or deleting it, changes the badge count.
  const { refresh: refreshBadges } = useNotifications();

  const detail = applications.find((a) => a._id === detailId) || null;
  const resumeOf = applications.find((a) => a._id === resumeId) || null;

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // A from-after-to range is invalid; ignore it rather than return an
      // unexplained empty list.
      const validRange = !(from && to && from > to);
      const res = await applicationApi.list({
        search,
        status,
        role,
        from: validRange ? from : undefined,
        to: validRange ? to : undefined,
      });
      setApplications(res.data.applications || []);
      if (Array.isArray(res.data.roles)) {
        setRoleOptions(res.data.roles.filter(Boolean).sort((a, b) => a.localeCompare(b)));
      }
    } catch (err) {
      setError(err?.message || 'Could not load applications.');
    } finally {
      setLoading(false);
    }
  }, [search, status, role, from, to]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // A record can leave the list while its popup is open - deleted, or filtered
  // out by a search or a status change. Close rather than strand an empty modal.
  useEffect(() => {
    if (loading) return;
    if (detailId && !applications.some((a) => a._id === detailId)) setDetailId(null);
    if (resumeId && !applications.some((a) => a._id === resumeId)) setResumeId(null);
  }, [applications, loading, detailId, resumeId]);

  const openDetail = (app) => {
    setDetailId(app._id);
    setRemarks(app.notes || '');
  };

  const closeDetail = () => {
    setDetailId(null);
    setRemarks('');
  };

  const setAppStatus = async (app, next) => {
    try {
      await applicationApi.setStatus(app._id, { status: next });
      toast.success(`Marked ${app.name} as ${next}.`);
      fetchApplications();
      refreshBadges();
    } catch (err) {
      toast.error(err.message || 'Could not update the application.');
    }
  };

  const setAttendance = async (app, value) => {
    try {
      await applicationApi.setStatus(app._id, { interviewAttended: value });
      toast.success(`Interview for ${app.name}: ${attendanceLabel(value).toLowerCase()}.`);
      fetchApplications();
    } catch (err) {
      toast.error(err.message || 'Could not update the interview record.');
    }
  };

  const saveRemarks = async (app) => {
    setSavingRemarks(true);
    try {
      await applicationApi.setStatus(app._id, { notes: remarks });
      toast.success(`Remarks saved for ${app.name}.`);
      fetchApplications();
    } catch (err) {
      toast.error(err.message || 'Could not save the remarks.');
    } finally {
      setSavingRemarks(false);
    }
  };

  const handleDelete = async (app) => {
    if (!window.confirm(`Delete the application from "${app.name}"? This cannot be undone.`)) return;
    try {
      await applicationApi.remove(app._id);
      toast.success(`Deleted application from ${app.name}.`);
      fetchApplications();
      refreshBadges();
    } catch (err) {
      toast.error(err.message || 'Delete failed. Please try again.');
    }
  };

  const canUpdate = hasPermission('applications.update');

  return (
    <PermissionGuard permission="applications.read">
      <h1>Job Applications</h1>
      <p className="page-sub">Candidate applications submitted through the careers pages.</p>

      <div className="admin-card admin-filter-bar">
        <input
          type="text"
          placeholder="Search name, email or role..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="admin-filter admin-filter--grow"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="admin-filter"
        >
          <option value="all">All roles</option>
          {roleOptions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="admin-filter"
        >
          <option value="all">All statuses</option>
          {FILTER_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input
          type="date"
          aria-label="Applied from"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="admin-filter"
        />
        <input
          type="date"
          aria-label="Applied to"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="admin-filter"
        />
        {(searchInput || status !== 'all' || role !== 'all' || from || to) && (
          <button
            type="button"
            className="admin-btn outline"
            onClick={() => {
              setSearchInput('');
              setSearch('');
              setStatus('all');
              setRole('all');
              setFrom('');
              setTo('');
            }}
          >
            Clear
          </button>
        )}
      </div>

      {!loading && !error && (
        <p className="admin-filter-meta">
          Showing <strong>{applications.length}</strong> application{applications.length === 1 ? '' : 's'}
          {search || status !== 'all' || role !== 'all' ? ' matching the current filters' : ''}
          {from && to && from > to ? (
            <span className="admin-filter-meta__warn">
              From date is after To date — the date filter is ignored.
            </span>
          ) : null}
        </p>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Candidate</th><th>Role</th><th>Applied on</th><th>Resume</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={COLUMNS}><ShimmerPanel variant="table" header={false} /></td></tr>
            ) : error ? (
              <tr><td colSpan={COLUMNS}><ErrorState compact title="Couldn't load applications" text={error} onRetry={fetchApplications} /></td></tr>
            ) : applications.length === 0 ? (
              <tr><td colSpan={COLUMNS}><EmptyState compact title="No applications" text={(search || status !== 'all' || role !== 'all' || from || to) ? 'No applications match the current filters.' : 'Applications submitted from a job page will appear here.'} /></td></tr>
            ) : (
              applications.map((a) => (
                <tr key={a._id}>
                  <td>
                    <strong>{a.name}</strong>
                    <div className="admin-sub-line">{a.phone || a.email}</div>
                  </td>
                  <td>{a.jobTitle || '-'}</td>
                  <td style={{ fontSize: '12px' }}>{when(a.createdAt)}</td>
                  <td>
                    {hasResume(a) ? (
                      <button type="button" className="admin-icon-btn act-edit" onClick={() => setResumeId(a._id)}>
                        Resume
                      </button>
                    ) : a.resumeLink ? (
                      <a href={safeHref(a.resumeLink)} target="_blank" rel="noopener noreferrer" className="admin-icon-btn act-edit">Link</a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td><span className={`admin-badge ${BADGE[a.status] || 'grey'}`}>{a.status}</span></td>
                  <td>
                    <div className="actions">
                      <button type="button" className="admin-icon-btn act-view" onClick={() => openDetail(a)}>
                        View
                      </button>
                      {hasPermission('applications.delete') && (
                        <button type="button" className="admin-icon-btn danger" onClick={() => handleDelete(a)}>Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Candidate detail. A popup rather than an inline row, so a long list
          does not shift under the admin while they read one application. */}
      <Modal show={!!detail} onHide={closeDetail} size="lg" centered scrollable>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '17px' }}>
            {detail?.name}
            {detail?.jobTitle ? ` - ${detail.jobTitle}` : ''}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detail ? (
            <>
              <dl className="admin-kv">
                <dt>Name</dt>
                <dd>{detail.name}</dd>
                <dt>Father&apos;s name</dt>
                <dd>{detail.fatherName || '-'}</dd>
                <dt>Mobile</dt>
                <dd>{detail.phone ? <a href={`tel:${detail.phone}`}>{detail.phone}</a> : '-'}</dd>
                <dt>Parent mobile</dt>
                <dd>
                  {detail.parentMobile ? <a href={`tel:${detail.parentMobile}`}>{detail.parentMobile}</a> : '-'}
                </dd>
                <dt>Email</dt>
                <dd><a href={`mailto:${detail.email}`}>{detail.email}</a></dd>
                <dt>Address</dt>
                <dd className="admin-kv__wrap">{detail.address || '-'}</dd>
                <dt>Qualification</dt>
                <dd>{detail.qualification || '-'}</dd>
                <dt>Work experience</dt>
                <dd className="admin-kv__wrap">{detail.experience || '-'}</dd>
                <dt>Applied for</dt>
                <dd>
                  {detail.jobSlug ? (
                    <a href={`/careers/${detail.jobSlug}`} target="_blank" rel="noopener noreferrer">
                      {detail.jobTitle || `/careers/${detail.jobSlug}`}
                    </a>
                  ) : '-'}
                </dd>
                <dt>Applied on</dt>
                <dd>{when(detail.createdAt)}</dd>
                <dt>Declaration</dt>
                <dd>{detail.declaration ? 'Accepted' : 'Not recorded'}</dd>
                <dt>Interview</dt>
                <dd>{attendanceLabel(detail.interviewAttended)}</dd>
                <dt>Resume</dt>
                <dd>
                  {hasResume(detail) ? (
                    <button type="button" className="admin-linkish" onClick={() => setResumeId(detail._id)}>
                      {detail.resumeName || 'Open resume'}
                    </button>
                  ) : detail.resumeLink ? (
                    <a href={safeHref(detail.resumeLink)} target="_blank" rel="noopener noreferrer">Candidate link</a>
                  ) : 'Not provided'}
                </dd>
              </dl>

              {canUpdate ? (
                <>
                  <div className="app-detail__actions">
                    <span>Set status:</span>
                    {STAGES.map((stage) => (
                      <button
                        key={stage}
                        type="button"
                        className={`admin-icon-btn ${detail.status === stage ? 'act-publish' : 'act-edit'}`}
                        onClick={() => setAppStatus(detail, stage)}
                        disabled={detail.status === stage}
                      >
                        {stage}
                      </button>
                    ))}
                  </div>

                  <div className="app-detail__actions">
                    <span>Interview attended:</span>
                    {ATTENDANCE.map(([value, label]) => (
                      <button
                        key={label}
                        type="button"
                        className={`admin-icon-btn ${(detail.interviewAttended || '') === value ? 'act-publish' : 'act-edit'}`}
                        onClick={() => setAttendance(detail, value)}
                        disabled={(detail.interviewAttended || '') === value}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="app-detail__remarks">
                    <label htmlFor="app-remarks">Remarks</label>
                    <textarea
                      id="app-remarks"
                      rows={3}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Where this candidate stands - interview outcome, follow-up, who spoke to them."
                    />
                    <button
                      type="button"
                      className="admin-btn"
                      onClick={() => saveRemarks(detail)}
                      disabled={savingRemarks || remarks === (detail.notes || '')}
                    >
                      {savingRemarks ? 'Saving...' : 'Save remarks'}
                    </button>
                  </div>
                </>
              ) : detail.notes ? (
                <div className="app-detail__note">
                  <h3>Remarks</h3>
                  <p>{detail.notes}</p>
                </div>
              ) : null}
            </>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          {detail && hasResume(detail) ? (
            <button type="button" className="admin-btn outline" onClick={() => setResumeId(detail._id)}>
              View resume
            </button>
          ) : null}
          <button type="button" className="admin-outline-btn" onClick={closeDetail}>
            Close
          </button>
        </Modal.Footer>
      </Modal>

      {/* Resume viewer, stacked over the detail popup. Opening it only previews
          the file - nothing is saved to disk until Download is clicked. PDFs
          preview inline; the browser cannot render Word, so those offer the
          download alone. */}
      <Modal
        show={!!resumeOf}
        onHide={() => setResumeId(null)}
        size="xl"
        centered
        className="resume-modal"
        backdropClassName="resume-modal-backdrop"
      >
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '17px' }}>
            {resumeOf?.name} - {resumeOf?.jobTitle || 'application'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="resume-modal__body">
          {resumeOf && isPdf(resumeOf) ? (
            <iframe
              src={resumeHref(resumeOf._id, true)}
              title={`Resume from ${resumeOf.name}`}
              className="resume-modal__frame"
            />
          ) : (
            <div className="resume-modal__fallback">
              <p>
                <strong>{resumeOf?.resumeName || 'This resume'}</strong> is a Word document, which
                the browser cannot preview.
              </p>
              <p>Download it to open in Word.</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {resumeOf ? (
            <a
              className="admin-btn"
              href={resumeHref(resumeOf._id, false)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Download
            </a>
          ) : null}
          <button type="button" className="admin-outline-btn" onClick={() => setResumeId(null)}>
            Close
          </button>
        </Modal.Footer>
      </Modal>
    </PermissionGuard>
  );
}
