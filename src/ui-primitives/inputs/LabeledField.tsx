export interface LabeledFieldClassNames {
  /** Optional wrapper around label + input + error. Omit to render them as a fragment. */
  field?: string
  label?: string
  input?: string
  error?: string
}

export interface LabeledFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  autoComplete?: string
  inputMode?: 'numeric'
  required?: boolean
  /** Inline error; when set, the input is wired to it via aria-invalid / aria-describedby. */
  error?: string
  /** Caller-supplied class names so each surface keeps its own styling (the primitive is style-neutral). */
  classNames?: LabeledFieldClassNames
}

/**
 * Accessible labelled input with an inline error paired to the input via `aria-describedby` /
 * `aria-invalid` (BI-260065 / ADR-260051). Style-neutral: callers pass their own class names, so the
 * auth screens and the account-settings password form share one accessible structure without sharing CSS.
 */
export function LabeledField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
  inputMode,
  required = true,
  error,
  classNames,
}: LabeledFieldProps) {
  const errorId = `${id}-error`
  const body = (
    <>
      <label htmlFor={id} className={classNames?.label}>{label}</label>
      <input
        id={id}
        className={classNames?.input}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {error && <p id={errorId} className={classNames?.error}>{error}</p>}
    </>
  )
  return classNames?.field ? <div className={classNames.field}>{body}</div> : body
}
