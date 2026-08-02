import * as React from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog"

export type BaseConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /**
   * Dialog KHÔNG tự đóng khi bấm xác nhận (hỗ trợ mutation async +
   * `confirmPending`). Tự gọi `onOpenChange(false)` trong `onConfirm`/
   * `onSuccess` khi xong.
   */
  onConfirm: () => void
  /** true = nút xác nhận màu destructive (xoá, huỷ...). */
  variant?: "default" | "destructive"
  confirmDisabled?: boolean
  confirmPending?: boolean
  /** Nội dung phụ giữa description và footer (vd input xác nhận tên). */
  children?: React.ReactNode
}

function BaseConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Huỷ",
  onConfirm,
  variant = "default",
  confirmDisabled,
  confirmPending,
  children,
}: BaseConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        {children ? <div className="space-y-2 px-1">{children}</div> : null}
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            variant={variant === "destructive" ? "destructive" : "default"}
            disabled={confirmDisabled || confirmPending}
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export { BaseConfirmDialog }
