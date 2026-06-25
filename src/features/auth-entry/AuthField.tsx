import { LabeledField } from '../../ui-primitives/inputs'

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

/** Auth-styled binding of the shared {@link LabeledField} primitive (BI-260065) — the sign-in-page
 * look applied to the accessible field used by the sign-up and password-reset panels. */
const AUTH_FIELD_CLASSES = {
  field: 'sign-in-page__field',
  label: 'sign-in-page__label',
  input: 'sign-in-page__input',
  error: 'sign-in-page__field-error',
}

export function AuthField(props: AuthFieldProps) {
  return <LabeledField {...props} classNames={AUTH_FIELD_CLASSES} />
}
