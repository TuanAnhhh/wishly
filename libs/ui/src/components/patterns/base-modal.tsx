import * as React from "react"

import { cn } from "../../lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import { ScrollArea } from "../ui/scroll-area"

const SIZE_CLASS = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
} as const

export type BaseModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  /** Element mở modal (asChild) — bỏ qua nếu tự điều khiển `open` từ ngoài (vd nút trong dropdown). */
  trigger?: React.ReactElement
  children: React.ReactNode
  /** Vùng nút hành động cuối modal — thường 1-2 `Button`/`BaseButton`. */
  footer?: React.ReactNode
  size?: keyof typeof SIZE_CLASS
  showCloseButton?: boolean
  /** true khi nội dung dài cần cuộn riêng, giữ header/footer cố định (thay ScrollArea + Dialog* ghép tay). */
  scrollable?: boolean
  className?: string
  contentClassName?: string
}

/**
 * Facade cho `Dialog` (L1) — thay mọi modal ghép tay
 * (`fixed inset-0 z-50` tự viết, hoặc `Dialog`+`DialogContent`+`DialogHeader`+`DialogTitle` lặp lại).
 */
function BaseModal({
  open,
  onOpenChange,
  title,
  description,
  trigger,
  children,
  footer,
  size = "md",
  showCloseButton = true,
  scrollable = false,
  className,
  contentClassName,
}: BaseModalProps) {
  const body = scrollable ? (
    <ScrollArea className="max-h-[70vh]">
      <div className={cn("pr-3", contentClassName)}>{children}</div>
    </ScrollArea>
  ) : (
    <div className={contentClassName}>{children}</div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent
        showCloseButton={showCloseButton}
        className={cn(SIZE_CLASS[size], className)}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        {body}
        {footer ? <DialogFooter>{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  )
}

export { BaseModal }
