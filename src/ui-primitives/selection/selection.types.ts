export interface RadioOption {
  value: string
  label: string
  disabled?: boolean
}

export interface RadioButtonProps {
  options: RadioOption[]
  value: string
  onChange: (value: string) => void
  name: string
  disabled?: boolean
  label?: string
}

export interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  indeterminate?: boolean
  ariaLabel?: string
}

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps {
  options: SelectOption[]
  value: string | undefined
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  label?: string
  helperText?: string
  ariaLabel?: string
}
