import * as React from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"

export type BaseDropdownMenuEntry = {
  type?: "item"
  /** React key khi cần override (mặc định dùng index). */
  key?: string
  label: React.ReactNode
  icon?: React.ReactNode
  onSelect?: () => void
  disabled?: boolean
  variant?: "default" | "destructive"
  /**
   * Bọc item bằng link tuỳ ý (react-router `Link`, `<a>`…) — asChild pattern.
   * Nhận children (icon + label) đã dựng sẵn, trả về element bọc ngoài.
   */
  render?: (children: React.ReactNode) => React.ReactElement
}

export type BaseDropdownMenuSeparatorEntry = {
  type: "separator"
  key?: string
}

export type BaseDropdownMenuLabelEntry = {
  type: "label"
  key?: string
  label: React.ReactNode
}

export type BaseDropdownMenuItem =
  | BaseDropdownMenuEntry
  | BaseDropdownMenuSeparatorEntry
  | BaseDropdownMenuLabelEntry

export type BaseDropdownMenuProps = {
  /** Element kích hoạt menu (Button, icon…) — asChild, forward props/ref tự động. */
  trigger: React.ReactElement
  /** Dùng `cond && {...}` trực tiếp trong mảng — falsy tự bị lọc bỏ. */
  items: Array<BaseDropdownMenuItem | false | null | undefined>
  align?: React.ComponentProps<typeof DropdownMenuContent>["align"]
  side?: React.ComponentProps<typeof DropdownMenuContent>["side"]
  sideOffset?: number
  contentClassName?: string
  modal?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function BaseDropdownMenu({
  trigger,
  items,
  align = "end",
  side,
  sideOffset,
  contentClassName,
  modal,
  open,
  onOpenChange,
}: BaseDropdownMenuProps) {
  return (
    <DropdownMenu modal={modal} open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        side={side}
        sideOffset={sideOffset}
        className={contentClassName}
      >
        {items
          .filter(
            (item): item is BaseDropdownMenuItem =>
              item !== null && item !== undefined && item !== false
          )
          .map((item, index) => {
            const key = item.key ?? index

            if (item.type === "separator") {
              return <DropdownMenuSeparator key={key} />
            }

            if (item.type === "label") {
              return (
                <DropdownMenuLabel key={key}>{item.label}</DropdownMenuLabel>
              )
            }

            const content = (
              <>
                {item.icon}
                {item.label}
              </>
            )

            if (item.render) {
              return (
                <DropdownMenuItem
                  key={key}
                  asChild
                  variant={item.variant}
                  disabled={item.disabled}
                >
                  {item.render(content)}
                </DropdownMenuItem>
              )
            }

            return (
              <DropdownMenuItem
                key={key}
                variant={item.variant}
                disabled={item.disabled}
                onSelect={item.onSelect}
              >
                {content}
              </DropdownMenuItem>
            )
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
BaseDropdownMenu.displayName = "BaseDropdownMenu"

export { BaseDropdownMenu }
