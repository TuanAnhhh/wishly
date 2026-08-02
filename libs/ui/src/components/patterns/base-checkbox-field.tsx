import * as React from "react"
import { useId } from "react"

import { cn } from "../../lib/utils"
import { Checkbox } from "../ui/checkbox"

export type BaseCheckboxFieldProps = Omit<
  React.ComponentProps<typeof Checkbox>,
  "id"
> & {
  label: React.ReactNode
  hint?: React.ReactNode
  error?: React.ReactNode
  id?: string
  wrapperClassName?: string
}

function BaseCheckboxField({
  label,
  hint,
  error,
  id,
  wrapperClassName,
  className,
  disabled,
  ...props
}: BaseCheckboxFieldProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const hintId = hint ? `${fieldId}-hint` : undefined
  const errorId = error ? `${fieldId}-error` : undefined
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined

  return (
    <div
      data-slot="checkbox-field"
      data-disabled={disabled || undefined}
      className={cn("flex flex-col gap-1.5", wrapperClassName)}
    >
      <div className="flex items-center gap-2">
        <Checkbox
          id={fieldId}
          disabled={disabled}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          className={className}
          {...props}
        />
        <label
          htmlFor={fieldId}
          className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
        >
          {label}
        </label>
      </div>
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="text-sm font-normal text-destructive"
        >
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-sm text-secondary-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export { BaseCheckboxField }
