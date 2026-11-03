import { useState, useEffect, useCallback, useRef } from 'react';
import { contactApi } from '../../api/contactApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import PermissionGuard from '../components/PermissionGuard.jsx';
import DetailModal from '../components/DetailModal.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import { ShimmerPanel, EmptyState, ErrorState } from '../../components/ui/States';
import { useToast } from '../../context/ToastContext';

export default function Messages() {
  const { hasPermission } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  // Typed immediately, applied 400ms later so a long run of keystrokes does not
  // fire a request per character.
  const [searchInput, setSearchInput] = useState('');
  const [interest, setInterest] = useState('all');
  const [interestOptions, setInterestOptions] = useState([]);
  const [filter, setFilter] = useState('all');
  // Brochure downloads arrive in this same inbox; they are read
  // differently from a question, so they can be separated out.
  const [source, setSource] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selected, setSelected] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [savingRemarks, setSavingRemarks] = useState(false);
  const toast = useToast();
  // Reading, resolving or deleting a message changes the unread count, so the
  // badges are told at once rather than staying wrong until the next poll.
  const { refresh: refreshBadges } = useNotifications();
  const unmounted = useRef(false);

  useEffect(() => {
    unmounted.current = false;
    return () => { unmounted.current = true; };
  }, []);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // A from-after-to range is invalid; ignore it rather than return an
      // unexplained empty list.
      const validRange = !(from && to && from > to);
      const res = await contactApi.list({
        status: filter === 'all' ? undefined : filter,
        source,
        search,
        interest,
        from: validRange ? from : undefined,
        to: validRange ? to : undefined,
      });
      if (unmounted.current) return;
      setMessages(res.data.messages || []);
      if (Array.isArray(res.data.interests)) {
        setInterestOptions(res.data.interests.filter(Boolean).sort((a, b) => a.localeCompare(b)));
      }
    } catch (err) {
      if (unmounted.current) return;
      setError(err?.message || 'Could not load messages.');
    } finally {
      if (!unmounted.current) setLoading(false);
    }
  }, [filter, search, interest, source, from, to]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleDelete = async (m) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await contactApi.remove(m._id);
      if (selected?._id === m._id) setSelected(null);
      toast.success('Message deleted.');
      fetchMessages();
      refreshBadges();
    } catch (err) {
      toast.error(err.message || 'Delete failed. Please try again.');
    }
  };
  const handleToggleRead = async (m) => {
    try {
      await contactApi.toggleRead(m._id);
      toast.success(m.status === 'read' ? 'Marked as new.' : 'Marked as read.');
      fetchMessages();
      refreshBadges();
    } catch (err) {
      toast.error(err.message || 'Update failed. Please try again.');
    }
  };
  const handleResolve = async (m) => {
    try {
      await contactApi.resolve(m._id);
      toast.success('Message resolved.');
      fetchMessages();
      refreshBadges();
    } catch (err) {
      toast.error(err.message || 'Update failed. Please try again.');
    }
  };

  const badge = (s) => ({ new: 'red', read: 'blue', resolved: 'green' }[s] || 'grey');
  const label = (s) => ({ new: 'New', read: 'Read', resolved: 'Resolved' }[s] || s);
  const INTEREST_LABEL = { business: 'Business Solutions', learning: 'Learning Programs', csr: 'CSR Partnership', other: 'Other' };
  const interestLabel = (v) => INTEREST_LABEL[v] || v || 'General';
  // Label the per-category answer the way the contact form's conditional field
  // does, so the table reads "Company name: Acme Corp" rather than a bare value.
  const INTEREST_FIELD_LABEL = { business: 'Company name', learning: 'Qualification', csr: 'Partnership type' };
  const fieldLabel = (interest, subject) => (subject && INTEREST_FIELD_LABEL[interest] ? `${INTEREST_FIELD_LABEL[interest]}: ${subject}` : subject);

  const openDetail = (m) => {
    setSelected(m);
    setRemarks(m.remarks || '');
    // Opening an inbox message reads it, so the unread badge and the row state
    // reflect that right away instead of waiting for the next poll.
    if (m.status === 'new') {
      contactApi.toggleRead(m._id)
        .then(() => { fetchMessages(); refreshBadges(); })
        .catch(() => {});
    }
  };

  const handleSaveRemarks = async (m) => {
    setSavingRemarks(true);
    try {
      await contactApi.saveRemarks(m._id, remarks);
      toast.success('Remarks saved.');
      setSelected((prev) => (prev ? { ...prev, remarks } : prev));
      fetchMessages();
    } catch (err) {
      toast.error(err.message || 'Could not save the remarks.');
    } finally {
      setSavingRemarks(false);
    }
  };

  return (
    <PermissionGuard permission="contact.read">
      <h1>Contact Messages</h1>
      <p className="page-sub">Messages submitted through the website contact form.</p>

      <div className="admin-card admin-filter-bar">
        <input
          type="text"
          placeholder="Search name, email or subject..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="admin-filter admin-filter--grow"
        />
        <select
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
          className="admin-filter"
        >
          <option value="all">All interests</option>
          {interestOptions.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="admin-filter"
        >
          <option value="all">All enquiries</option>
          <option value="contact">Contact form</option>
          <option value="brochure">Brochure downloads</option>
        </select>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="admin-filter"
        >
          {['all', 'new', 'read', 'resolved'].map((f) => (
            <option key={f} value={f}>{f === 'all' ? 'All statuses' : label(f)}</option>
          ))}
        </select>
        <input
          type="date"
          aria-label="Received from"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="admin-filter"
        />
        <input
          type="date"
          aria-label="Received to"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="admin-filter"
        />
        {(searchInput || filter !== 'all' || interest !== 'all' || from || to) && (
          <button
            type="button"
            className="admin-btn outline"
            onClick={() => {
              setSearchInput('');
              setSearch('');
              setFilter('all');
              setInterest('all');
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
          Showing <strong>{messages.length}</strong> message{messages.length === 1 ? '' : 's'}
          {search || filter !== 'all' || interest !== 'all' ? ' matching the current filters' : ''}
          {from && to && from > to ? (
            <span className="admin-filter-meta__warn">
              From date is after To date — the date filter is ignored.
            </span>
          ) : null}
        </p>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>From</th><th>Subject</th><th>Status</th><th>Received</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="5"><ShimmerPanel variant="table" header={false} /></td></tr>
            : error ? <tr><td colSpan="5"><ErrorState compact title="Couldn't load messages" text={error} onRetry={fetchMessages} /></td></tr>
            : messages.length === 0 ? <tr><td colSpan="5"><EmptyState compact title="No messages yet" text={(search || filter !== 'all' || interest !== 'all' || from || to) ? 'No messages match the current filters.' : 'Messages submitted through the website contact form will appear here.'} /></td></tr>
            : messages.map((m) => (
              <tr key={m._id}>
                <td>
                  <strong>{m.name}</strong><br />
                  <span style={{ fontSize: '12px', color: 'var(--admin-muted)' }}>{m.email}</span>
                </td>
                <td>
                  {/* A brochure lead is marked in the row itself: the team
                      reads it differently from a question, and the name of
                      the programme taken is the useful part. */}
                  {m.source === 'brochure' ? (
                    <>
                      <span className="admin-badge yellow">Brochure</span>
                      <div className="admin-sub-line">{m.resource || m.interest}</div>
                    </>
                  ) : (
                    <>
                      {interestLabel(m.interest)}
                      {fieldLabel(m.interest, m.subject) ? <div className="admin-sub-line">{fieldLabel(m.interest, m.subject)}</div> : null}
                    </>
                  )}
                </td>
                <td><span className={`admin-badge ${badge(m.status)}`}>{label(m.status)}</span></td>
                <td>{new Date(m.createdAt).toLocaleString()}</td>
                <td>
                  <div className="actions">
                    <button className="admin-icon-btn act-view" onClick={() => openDetail(m)}>View</button>
                    {hasPermission('contact.read') && <button className="admin-icon-btn act-mark" onClick={() => handleToggleRead(m)}>{m.status === 'read' ? 'Mark new' : 'Mark read'}</button>}
                    {hasPermission('contact.delete') && <button className="admin-icon-btn danger" onClick={() => handleDelete(m)}>Delete</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DetailModal
        show={!!selected}
        onHide={() => setSelected(null)}
        title={selected?.name}
        subtitle={selected ? `${selected.email} - ${new Date(selected.createdAt).toLocaleString()}` : ''}
        footer={
          selected ? (
            <>
              <button className="admin-btn success" onClick={() => handleResolve(selected)}>Mark Resolved</button>
              {hasPermission('contact.delete') && <button className="admin-btn danger" onClick={() => handleDelete(selected)}>Delete</button>}
              <button className="admin-outline-btn" onClick={() => setSelected(null)}>Close</button>
            </>
          ) : null
        }
      >
        {selected && (
          <>
            <dl className="admin-kv">
              <dt>Status</dt>
              <dd><span className={`admin-badge ${badge(selected.status)}`}>{label(selected.status)}</span></dd>
              <dt>Source</dt>
              <dd>{selected.source === 'brochure' ? 'Brochure download' : 'Contact form'}</dd>
              <dt>Interest</dt>
              <dd>{interestLabel(selected.interest)}</dd>
              {fieldLabel(selected.interest, selected.subject) ? (
                <>
                  <dt>{INTEREST_FIELD_LABEL[selected.interest] || 'Subject'}</dt>
                  <dd>{fieldLabel(selected.interest, selected.subject)}</dd>
                </>
              ) : null}
              {selected.resource ? (
                <>
                  <dt>Resource</dt>
                  <dd>{selected.resource}</dd>
                </>
              ) : null}
              {selected.phone ? (
                <>
                  <dt>Phone</dt>
                  <dd><a href={`tel:${selected.phone.replace(/[^+0-9]/g, '')}`}>{selected.phone}</a></dd>
                </>
              ) : null}
              {selected.email ? (
                <>
                  <dt>Email</dt>
                  <dd><a href={`mailto:${selected.email}`}>{selected.email}</a></dd>
                </>
              ) : null}
            </dl>
            {selected.message ? (
              <p className="admin-kv__text" style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px dashed var(--admin-border)', lineHeight: 1.65 }}>
                {selected.message}
              </p>
            ) : null}

            {hasPermission('contact.update') ? (
              <div className="app-detail__remarks">
                <label htmlFor="msg-remarks">Remarks</label>
                <textarea
                  id="msg-remarks"
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Private notes for the team - follow-up, who handled it, next steps."
                />
                <button
                  type="button"
                  className="admin-btn"
                  onClick={() => handleSaveRemarks(selected)}
                  disabled={savingRemarks || remarks === (selected.remarks || '')}
                >
                  {savingRemarks ? 'Saving...' : 'Save remarks'}
                </button>
              </div>
            ) : selected.remarks ? (
              <div className="app-detail__note" style={{ marginTop: '16px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--admin-dark)' }}>Remarks</span>
                <p style={{ margin: '6px 0 0', fontSize: '13.5px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selected.remarks}</p>
              </div>
            ) : null}
          </>
        )}
      </DetailModal>
    </PermissionGuard>
  );
}
