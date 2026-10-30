export function LoadingState({ label = 'Loading...', compact }) {
  return (
    <div className={`state-wrap${compact ? ' compact' : ''}`} role="status" aria-live="polite">
      <span className="state-spinner" aria-hidden="true" />
      <p className="state-text">{label}</p>
    </div>
  );
}

export function Shimmer({ cards = 6, compact }) {
  return (
    <div
      className={`shimmer-wrap${compact ? ' compact' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <span className="shimmer-block shimmer-title" />
      <span className="shimmer-block shimmer-subtitle" />
      <div className="shimmer-grid">
        {Array.from({ length: cards }).map((_, i) => (
          <div className="shimmer-card" key={i}>
            <span className="shimmer-block shimmer-thumb" />
            <span className="shimmer-block shimmer-line" />
            <span className="shimmer-block shimmer-line shimmer-line-short" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ShimmerTable({ rows = 5 }) {
  return (
    <div className="shimmer-table" role="status" aria-live="polite" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div className="shimmer-table-row" key={i}>
          <span className="shimmer-block shimmer-line" />
          <span className="shimmer-block shimmer-line shimmer-line-short" />
          <span className="shimmer-block shimmer-line shimmer-line-third" />
          <span className="shimmer-block shimmer-line shimmer-line-thumb" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', text, action, compact }) {
  return (
    <div className={`state-wrap${compact ? ' compact' : ''}`}>
      <span className="state-icon" aria-hidden="true">◎</span>
      <p className="state-title">{title}</p>
      {text && <p className="state-text">{text}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', text, onRetry, compact }) {
  return (
    <div className={`state-wrap${compact ? ' compact' : ''}`} role="alert">
      <span className="state-icon error" aria-hidden="true">!</span>
      <p className="state-title">{title}</p>
      {text && <p className="state-text">{text}</p>}
      {onRetry && (
        <button type="button" className="state-btn" onClick={onRetry}>Try again</button>
      )}
    </div>
  );
}

function B({ className }) {
  return <span className={`admin-shimmer-block ${className}`} />;
}

export function ShimmerPanel({ variant = 'dashboard', rows = 6, fields = 4, header = true }) {
  return (
    <div className="admin-shimmer-panel" role="status" aria-live="polite" aria-label="Loading">
      {header && (
        <>
          <div className="admin-shimmer-head">
            <B className="admin-shimmer-title" />
            <B className="shimmer-btn" />
          </div>
          <B className="admin-shimmer-sub" />
        </>
      )}

      {variant === 'dashboard' && (
        <div className="admin-shimmer-stats">
          {Array.from({ length: 5 }).map((_, i) => (
            <div className="admin-shimmer-stat" key={i}>
              <div className="admin-shimmer-block shimmer-num" />
              <div className="admin-shimmer-block shimmer-lbl" />
            </div>
          ))}
        </div>
      )}

      {variant === 'table' && (
        <div className="admin-shimmer-table">
          {Array.from({ length: rows }).map((_, i) => (
            <div className="shimmer-row" key={i}>
              <div className="admin-shimmer-block shimmer-cell shimmer-cell-xs" />
              <div className="admin-shimmer-block shimmer-cell" />
              <div className="admin-shimmer-block shimmer-cell shimmer-cell-sm" />
              <div className="admin-shimmer-block shimmer-cell shimmer-cell-sm" />
              <div className="admin-shimmer-block shimmer-cell" />
            </div>
          ))}
        </div>
      )}

      {variant === 'form' && (
        <div className="admin-shimmer-form">
          {Array.from({ length: fields }).map((_, i) => (
            <div className="shimmer-field" key={i}>
              <div className="admin-shimmer-block shimmer-label" />
              <div className={`admin-shimmer-block ${i % 3 === 2 ? 'shimmer-textarea' : 'shimmer-input'}`} />
            </div>
          ))}
          <div className="shimmer-row-fields">
            <div className="shimmer-field">
              <div className="admin-shimmer-block shimmer-label" />
              <div className="admin-shimmer-block shimmer-input" />
            </div>
            <div className="shimmer-field">
              <div className="admin-shimmer-block shimmer-label" />
              <div className="admin-shimmer-block shimmer-input" />
            </div>
          </div>
          <div className="admin-shimmer-block shimmer-btn" />
        </div>
      )}
    </div>
  );
}