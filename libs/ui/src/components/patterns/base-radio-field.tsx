import * as React from "react"

import { cn } from "../../lib/utils"
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"
import { FieldChrome, useFieldIds } from "./base-field-chrome.js"

export type BaseRadioFieldOption = {
  value: string
  label: React.ReactNode
  hint?: React.ReactNode
  disabled?: boolean
}

export type BaseRadioFieldProps = {
  label?: React.ReactNode
  hint?: React.ReactNode
  error?: React.ReactNode
  required?: boolean
  disabled?: boolean
  id?: string
  wrapperClassName?: string
  /** className cho `RadioGroup` — mặc định xếp dọc (`grid gap-3`), truyền `flex flex-row gap-4` để xếp ngang. */
  className?: string
  options: BaseRadioFieldOption[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  name?: string
}

function BaseRadioField({
  label,
  hint,
  error,
  required,
  disabled,
  id,
  wrapperClassName,
  className,
  options,
  value,
  defaultValue,
  onValueChange,
  name,
}: BaseRadioFieldProps) {
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
      <RadioGroup
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
        name={name}
        required={required}
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy}
        className={className}
      >
        {options.map((option) => {
          const optionId = `${fieldId}-${option.value}`
          return (
            <div key={option.value} className="flex items-start gap-2">
              <RadioGroupItem
                id={optionId}
                value={option.value}
                disabled={option.disabled}
                className="mt-0.5"
              />
              <label
                htmlFor={optionId}
                className={cn(
                  "text-sm leading-none font-medium",
                  option.disabled && "cursor-not-allowed opacity-50"
                )}
              >
                {option.label}
                {option.hint ? (
                  <p className="mt-1 text-sm leading-normal font-normal text-secondary-foreground">
                    {option.hint}
                  </p>
                ) : null}
              </label>
            </div>
          )
        })}
      </RadioGroup>
    </FieldChrome>
  )
}

export { BaseRadioField }
