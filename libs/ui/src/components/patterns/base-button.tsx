import * as React from "react"

import { Button, type ButtonProps } from "../ui/button"
import { Spinner } from "../ui/spinner"

export type BaseButtonProps = ButtonProps & {
  /** true khi đang chạy mutation/async — hiện spinner + tự disable. */
  loading?: boolean
  /** Label thay thế khi `loading` (mặc định giữ nguyên `children`). */
  loadingText?: React.ReactNode
}

/**
 * `Button` (L1) + trạng thái loading — thay pattern `disabled={mutation.isPending}`
 * không có feedback trực quan (spinner) lặp lại khắp app.
 */
const BaseButton = React.forwardRef<HTMLButtonElement, BaseButtonProps>(
  ({ loading, loadingText, disabled, asChild, children, ...props }, ref) => {
    if (asChild) {
      // asChild cần đúng 1 child (Slot) — bỏ qua spinner, chỉ forward disabled.
      return (
        <Button ref={ref} asChild disabled={disabled} {...props}>
          {children}
        </Button>
      )
    }

    return (
      <Button ref={ref} disabled={disabled || loading} {...props}>
        {loading ? <Spinner /> : null}
        {loading && loadingText !== undefined ? loadingText : children}
      </Button>
    )
  }
)
BaseButton.displayName = "BaseButton"

export { BaseButton }
