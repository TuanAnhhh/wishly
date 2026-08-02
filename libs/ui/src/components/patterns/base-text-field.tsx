import * as React from "react"

import { Input } from "../ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "../ui/input-group"
import { FieldChrome, useFieldIds } from "./base-field-chrome.js"

export type BaseTextFieldProps = Omit<
  React.ComponentProps<typeof Input>,
  "id"
> & {
  label?: React.ReactNode
  hint?: React.ReactNode
  error?: React.ReactNode
  required?: boolean
  id?: string
  /** className cho root wrapper — `className` vẫn đi thẳng vào `<input>`. */
  wrapperClassName?: string
  /** className riêng cho `<Label>` — dùng khi field nằm trên nền tối/màu. */
  labelClassName?: string
  /** Nội dung gắn đầu input (icon, ký tự…) — tự chuyển control sang InputGroup. */
  startAddon?: React.ReactNode
  /** Nội dung gắn cuối input (vd hậu tố domain `.thiepviet.vn`, đơn vị). */
  endAddon?: React.ReactNode
}

const BaseTextField = React.forwardRef<HTMLInputElement, BaseTextFieldProps>(
  (
    {
      label,
      hint,
      error,
      required,
      disabled,
      id,
      wrapperClassName,
      labelClassName,
      startAddon,
      endAddon,
      className,
      ...props
    },
    ref
  ) => {
    const { fieldId, describedBy } = useFieldIds(id, hint, error)
    const controlProps = {
      id: fieldId,
      disabled,
      required,
      "aria-invalid": !!error || undefined,
      "aria-describedby": describedBy,
      className,
      ...props,
    }

    return (
      <FieldChrome
        id={fieldId}
        label={label}
        hint={hint}
        error={error}
        required={required}
        disabled={disabled}
        className={wrapperClassName}
        labelClassName={labelClassName}
      >
        {startAddon || endAddon ? (
          <InputGroup>
            {startAddon ? <InputGroupAddon>{startAddon}</InputGroupAddon> : null}
            <InputGroupInput ref={ref} {...controlProps} />
            {endAddon ? (
              <InputGroupAddon align="inline-end">{endAddon}</InputGroupAddon>
            ) : null}
          </InputGroup>
        ) : (
          <Input ref={ref} {...controlProps} />
        )}
      </FieldChrome>
    )
  }
)
BaseTextField.displayName = "BaseTextField"

export { BaseTextField }
