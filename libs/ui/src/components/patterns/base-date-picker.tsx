import * as React from "react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { CalendarDateRangeIcon } from "@heroicons/react/24/outline"

import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { Calendar } from "../ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover"

function parseISODate(iso: string): Date | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return undefined
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export type BaseDatePickerProps = {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  id?: string
  className?: string
  disabled?: boolean
}

function BaseDatePicker({
  value = "",
  onChange,
  placeholder = "Chọn ngày",
  id,
  className,
  disabled,
}: BaseDatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const date = value ? parseISODate(value) : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          data-empty={!date}
          className={cn(
            "h-12 w-full justify-between px-3 text-left text-base font-normal shadow-none data-[empty=true]:text-secondary-foreground",
            className
          )}
        >
          {date ? (
            format(date, "dd/MM/yyyy", { locale: vi })
          ) : (
            <span>{placeholder}</span>
          )}
          <CalendarDateRangeIcon className="size-4 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={vi}
          selected={date}
          defaultMonth={date}
          onSelect={(next) => {
            onChange?.(next ? toISODate(next) : "")
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

export { BaseDatePicker }
