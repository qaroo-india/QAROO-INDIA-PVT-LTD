import { useId, useState } from 'react';

export default function PasswordInput({
  label,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  autoComplete,
  hint,
}) {
  const [show, setShow] = useState(false);
  // Generated, because this component renders several times on a page (current
  // password, new, confirm) and a fixed id would tie every label to the first.
  const id = useId();
  return (
    <div className="field">
      {label && <label htmlFor={id}>{label}</label>}
      <div className="admin-password-wrap">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="admin-password-toggle"
          onClick={() => setShow((s) => !s)}
          title={show ? 'Hide password' : 'Show password'}
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
        >
          {show ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}