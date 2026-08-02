import * as React from "react"

import { cn } from "../../lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import { FieldChrome, useFieldIds } from "./base-field-chrome.js"

export type BaseSelectFieldOption = {
  value: string
  label: React.ReactNode
  disabled?: boolean
}

export type BaseSelectFieldProps = {
  label?: React.ReactNode
  hint?: React.ReactNode
  error?: React.ReactNode
  required?: boolean
  disabled?: boolean
  id?: string
  wrapperClassName?: string
  /** className cho SelectTrigger. */
  className?: string
  placeholder?: string
  options: BaseSelectFieldOption[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  name?: string
}

function BaseSelectField({
  label,
  hint,
  error,
  required,
  disabled,
  id,
  wrapperClassName,
  className,
  placeholder = "Chọn…",
  options,
  value,
  defaultValue,
  onValueChange,
  name,
}: BaseSelectFieldProps) {
  const { fieldId, describedBy } = useFieldIds(id, hint, error)

  return (
    <FieldChrome
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      disabled={disabled}
      className={wrapperClassName}
    >
      <Select
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
        name={name}
        required={required}
      >
        <SelectTrigger
          id={fieldId}
          className={cn("w-full", className)}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldChrome>
  )
}

export { BaseSelectField }
