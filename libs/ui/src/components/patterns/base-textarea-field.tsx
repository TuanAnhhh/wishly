import * as React from "react"

import { Textarea } from "../ui/textarea"
import { FieldChrome, useFieldIds } from "./base-field-chrome.js"

export type BaseTextAreaFieldProps = Omit<
  React.ComponentProps<typeof Textarea>,
  "id"
> & {
  label?: React.ReactNode
  hint?: React.ReactNode
  error?: React.ReactNode
  required?: boolean
  id?: string
  wrapperClassName?: string
}

const BaseTextAreaField = React.forwardRef<
  HTMLTextAreaElement,
  BaseTextAreaFieldProps
>(
  (
    {
      label,
      hint,
      error,
      required,
      disabled,
      id,
      wrapperClassName,
      className,
      ...props
    },
    ref
  ) => {
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
        <Textarea
          ref={ref}
          id={fieldId}
          disabled={disabled}
          required={required}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          className={className}
          {...props}
        />
      </FieldChrome>
    )
  }
)
BaseTextAreaField.displayName = "BaseTextAreaField"

export { BaseTextAreaField }
