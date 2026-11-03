import { Fragment } from 'react';

const ALWAYS_SKIP = new Set(['_id', '__v', 'createdBy', 'updatedBy']);

const prettyLabel = (key) =>
  key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const isImageKey = (key) => /image|logo|ogImage/i.test(key);
const isEmailKey = (key) => /email/i.test(key) && !/seo/i.test(key) && !/og/i.test(key);
const isPhoneKey = (key) => /phone|mobile|tel/i.test(key);
const isLongKey = (key) => /desc|blurb|note|overview|message|note|remark/i.test(key);

const statusBadge = (value) => (
  <span className={`admin-badge ${value === 'published' ? 'green' : 'grey'}`}>{value}</span>
);

const isUrl = (v) => /^https?:\/\//i.test(v) || v.startsWith('/');
const isImageValue = (v) => isUrl(v) && /\.(png|jpe?g|gif|svg|webp|avif)(\?|$)/i.test(v) || /^data:image\//i.test(v);

function renderValue(key, value, depth = 0) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    if (value.every((v) => typeof v === 'string' || typeof v === 'number')) {
      if (depth > 0) return value.join(', ');
      return (
        <ul className="admin-kv__list">
          {value.map((item, i) => (
            <li key={i}>{typeof item === 'number' ? String(item) : item}</li>
          ))}
        </ul>
      );
    }
    if (depth > 0) {
      return value.map((item, i) => (
        <div key={i}>{typeof item === 'object' ? Object.values(item).filter(Boolean).join(' - ') : String(item)}</div>
      ));
    }
    return (
      <div className="admin-kv__stack">
        {value.map((item, i) => renderObjectItem(item, i))}
      </div>
    );
  }
  if (typeof value === 'object') {
    if (depth > 0) return Object.entries(value).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => `${prettyLabel(k)}: ${renderValue(k, v, depth + 1)}`).join('; ');
    return renderObjectItem(value, 0);
  }
  const str = String(value);
  if (key === 'status') return statusBadge(value);
  if (isImageKey(key) && (isImageValue(str) || isUrl(str))) {
    return <img className="admin-thumb" src={str} alt={prettyLabel(key)} />;
  }
  if (isEmailKey(key) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) {
    return <a href={`mailto:${str}`}>{str}</a>;
  }
  if (isPhoneKey(key) && /^[+0-9()\-\s]{6,20}$/.test(str)) {
    return <a href={`tel:${str.replace(/[^+0-9]/g, '')}`}>{str}</a>;
  }
  if (isUrl(str)) {
    return <a href={str} target="_blank" rel="noopener noreferrer">{str}</a>;
  }
  if (isLongKey(key) || str.length > 60) {
    return <span className="admin-kv__text">{str}</span>;
  }
  return str;
}

function renderObjectItem(item, key) {
  if (!item || typeof item !== 'object') return renderValue('', item, 1);
  const entries = Object.entries(item).filter(([, v]) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0));
  if (entries.length === 0) return null;
  const faqQ = entries.find(([k]) => k === 'q');
  const faqA = entries.find(([k]) => k === 'a');
  if (faqQ && faqA && entries.length === 2) {
    return (
      <div className="admin-kv__qa">
        <div className="admin-kv__qa-q">{String(faqQ[1])}</div>
        <div className="admin-kv__qa-a">{String(faqA[1])}</div>
      </div>
    );
  }
  const headingKey = entries.find(([k]) => k === 'title' || k === 'heading' || k === 'name');
  const rest = headingKey ? entries.filter(([k]) => k !== headingKey[0]) : entries;
  return (
    <div className="admin-kv__group-item" key={key}>
      {headingKey ? (
        <div className="admin-kv__group-title">{String(headingKey[1])}</div>
      ) : null}
      {rest.length > 0 ? (
        <dl className="admin-kv admin-kv--inner">
          {rest.map(([k, v]) => (
            <Fragment key={k}>
              <dt>{prettyLabel(k)}</dt>
              <dd className="admin-kv__cell">{renderValue(k, v, 1)}</dd>
            </Fragment>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

export default function RecordView({ record, labels = [], exclude = [] }) {
  if (!record) return null;
  const excludeSet = new Set([...ALWAYS_SKIP, ...exclude]);
  const ordered = labels.length > 0 ? labels : Object.keys(record).map((k) => [k, prettyLabel(k)]);
  const extras = labels.length > 0 ? Object.keys(record).filter((k) => !ordered.some(([key]) => key === k)) : [];
  const renderAll = [...ordered.map(([k, label]) => [k, label, record[k]]), ...extras.filter((k) => !excludeSet.has(k)).map((k) => [k, prettyLabel(k), record[k]])];
  return (
    <dl className="admin-kv">
      {renderAll.map(([k, label, value]) => {
        const skip = excludeSet.has(k);
        const isMetaDate = k === 'createdAt' || k === 'updatedAt';
        const rendered = renderValue(k, value);
        if (!rendered) return null;
        if (isMetaDate && typeof value === 'string') {
          return (
            <Fragment key={k}>
              <dt>{label}</dt>
              <dd>{new Date(value).toLocaleString()}</dd>
            </Fragment>
          );
        }
        if (Array.isArray(value) || (value && typeof value === 'object')) {
          if (skip) return null;
          return (
            <Fragment key={k}>
              <dt>{label}</dt>
              <dd>{rendered}</dd>
            </Fragment>
          );
        }
        if (skip) return null;
        return (
          <Fragment key={k}>
            <dt>{label}</dt>
            <dd>{rendered || '-'}</dd>
          </Fragment>
        );
      })}
    </dl>
  );
}