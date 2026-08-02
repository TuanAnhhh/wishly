import * as React from "react"
import { useId } from "react"

import { cn } from "../../lib/utils"
import { Label } from "../ui/label"

/** Internal helper — not exported from index.ts. Shared by *Field facades. */
export function useFieldIds(
  id: string | undefined,
  hint: React.ReactNode,
  error: React.ReactNode
) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const hintId = hint ? `${fieldId}-hint` : undefined
  const errorId = error ? `${fieldId}-error` : undefined
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined
  return { fieldId, hintId, errorId, describedBy }
}

export type FieldChromeProps = {
  id: string
  label?: React.ReactNode
  hint?: React.ReactNode
  error?: React.ReactNode
  required?: boolean
  disabled?: boolean
  className?: string
  /** className riêng cho `<Label>` — dùng khi field nằm trên nền tối/màu (vd. trang check-in). */
  labelClassName?: string
  children: React.ReactNode
}

export function FieldChrome({
  id,
  label,
  hint,
  error,
  required,
  disabled,
  className,
  labelClassName,
  children,
}: FieldChromeProps) {
  const { hintId, errorId } = useFieldIds(id, hint, error)

  return (
    <div
      data-slot="field-chrome"
      data-disabled={disabled || undefined}
      className={cn(
        "flex w-full flex-col gap-1.5 data-[disabled]:opacity-50",
        className
      )}
    >
      {label ? (
        <Label
          htmlFor={id}
          data-slot="field-chrome-label"
          className={labelClassName}
        >
          {label}
          {required ? (
            <span aria-hidden="true" className="text-destructive">
              *
            </span>
          ) : null}
        </Label>
      ) : null}
      {children}
      {error ? (
        <p
          id={errorId}
          role="alert"
          data-slot="field-chrome-error"
          className="text-sm font-normal text-destructive"
        >
          {error}
        </p>
      ) : hint ? (
        <p
          id={hintId}
          data-slot="field-chrome-hint"
          className="text-sm leading-normal text-secondary-foreground"
        >
          {hint}
        </p>
      ) : null}
    </div>
  )
}
