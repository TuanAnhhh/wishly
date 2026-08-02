import * as React from "react"
import { useId } from "react"

import { cn } from "../../lib/utils"
import { Switch } from "../ui/switch"

export type BaseSwitchFieldProps = Omit<
  React.ComponentProps<typeof Switch>,
  "id"
> & {
  /** Nhãn chính (đậm) — vd "Hiển thị công khai sổ lưu bút". */
  label: React.ReactNode
  /** Mô tả phụ dưới label. */
  hint?: React.ReactNode
  id?: string
  wrapperClassName?: string
}

function BaseSwitchField({
  label,
  hint,
  id,
  wrapperClassName,
  className,
  disabled,
  ...props
}: BaseSwitchFieldProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const hintId = hint ? `${fieldId}-hint` : undefined

  return (
    <div
      data-slot="switch-field"
      data-disabled={disabled || undefined}
      className={cn(
        "flex items-center justify-between gap-4",
        "data-[disabled]:opacity-50",
        wrapperClassName
      )}
    >
      <div>
        <label htmlFor={fieldId} className="font-medium">
          {label}
        </label>
        {hint ? (
          <p id={hintId} className="text-sm text-secondary-foreground">
            {hint}
          </p>
        ) : null}
      </div>
      <Switch
        id={fieldId}
        disabled={disabled}
        aria-describedby={hintId}
        className={className}
        {...props}
      />
    </div>
  )
}

export { BaseSwitchField }
