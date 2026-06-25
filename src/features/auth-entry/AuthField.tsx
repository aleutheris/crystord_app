interface AuthFieldProps {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  autoComplete?: string
  inputMode?: 'numeric'
  error?: string
}

/**
 * Accessible labelled input with an inline error paired to the input via `aria-describedby` /
 * `aria-invalid`. Shared by the sign-up and password-reset panels.
 */
export function AuthField({ id, label, value, onChange, type = 'text', autoComplete, inputMode, error }: AuthFieldProps) {
  const errorId = `${id}-error`
  return (
    <div className="sign-in-page__field">
      <label htmlFor={id} className="sign-in-page__label">{label}</label>
      <input
        id={id}
        className="sign-in-page__input"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {error && <p id={errorId} className="sign-in-page__field-error">{error}</p>}
    </div>
  )
}
