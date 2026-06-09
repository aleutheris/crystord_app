export type InputSize = 'sm' | 'md' | 'lg'
export type InputState = 'default' | 'error' | 'success' | 'disabled'

export interface BaseInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  state?: InputState
  size?: InputSize
  label?: string
  helperText?: string
  ariaLabel?: string
  id?: string
}

export type TextInputProps = BaseInputProps

export type PasswordInputProps = BaseInputProps

export interface SearchInputProps extends BaseInputProps {
  onSearch?: () => void
  onClear?: () => void
}
