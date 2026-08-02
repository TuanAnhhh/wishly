import * as React from "react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { CalendarDateRangeIcon } from "@heroicons/react/24/outline"

import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { Calendar } from "../ui/calendar"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "../ui/field.js"
import { Input } from "../ui/input"
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

/** Split ISO datetime (e.g. 2026-11-15T18:00:00+07:00) into form parts. */
function splitDateTime(iso: string): { date: string; time: string } {
  const m = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}):(\d{2}))?/.exec(iso)
  if (!m) return { date: "", time: "18:00" }
  return {
    date: m[1],
    time: m[2] && m[3] ? `${m[2]}:${m[3]}` : "18:00",
  }
}

/** Normalize `HH:mm` or `HH:mm:ss` → `HH:mm`. */
function normalizeTime(time: string): string {
  const m = /^(\d{2}):(\d{2})/.exec(time)
  if (!m) return "18:00"
  return `${m[1]}:${m[2]}`
}

/** Compose form parts to ISO with Vietnam offset (+07:00). */
function composeDateTime(date: string, time: string): string {
  if (!date) return ""
  return `${date}T${normalizeTime(time)}:00+07:00`
}

export type BaseDatePickerTimeProps = {
  /** ISO datetime string, e.g. `2026-11-15T18:00:00+07:00` */
  value?: string
  onChange?: (value: string) => void
  id?: string
  className?: string
  disabled?: boolean
  datePlaceholder?: string
  dateLabel?: string
  timeLabel?: string
  description?: string
}

function BaseDatePickerTime({
  value = "",
  onChange,
  id = "date-picker-time",
  className,
  disabled,
  datePlaceholder = "Chọn ngày",
  dateLabel = "Ngày",
  timeLabel = "Giờ",
  description,
}: BaseDatePickerTimeProps) {
  const [open, setOpen] = React.useState(false)
  const { date: dateStr, time: valueTime } = splitDateTime(value)
  const [time, setTime] = React.useState(valueTime)
  const date = dateStr ? parseISODate(dateStr) : undefined
  const dateId = `${id}-date`
  const timeId = `${id}-time`

  React.useEffect(() => {
    setTime(valueTime)
  }, [valueTime])

  return (
    <FieldGroup className={cn("gap-2", className)}>
      <div className="flex flex-row gap-3">
        <Field className="min-w-0 flex-1">
          <FieldLabel htmlFor={dateId}>{dateLabel}</FieldLabel>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                id={dateId}
                type="button"
                variant="outline"
                disabled={disabled}
                data-empty={!date}
                className="h-12 w-full justify-between px-3 text-left text-base font-normal shadow-none data-[empty=true]:text-secondary-foreground"
              >
                {date ? (
                  format(date, "dd/MM/yyyy", { locale: vi })
                ) : (
                  <span>{datePlaceholder}</span>
                )}
                <CalendarDateRangeIcon className="size-4 opacity-60" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto overflow-hidden p-0" align="start">
              <Calendar
                mode="single"
                locale={vi}
                selected={date}
                defaultMonth={date}
                onSelect={(next) => {
                  onChange?.(
                    next ? composeDateTime(toISODate(next), time) : ""
                  )
                  setOpen(false)
                }}
              />
            </PopoverContent>
          </Popover>
        </Field>
        <Field className="w-36 shrink-0">
          <FieldLabel htmlFor={timeId}>{timeLabel}</FieldLabel>
          <Input
            type="time"
            id={timeId}
            value={time}
            disabled={disabled}
            onChange={(e) => {
              const nextTime = normalizeTime(e.target.value)
              setTime(nextTime)
              if (dateStr) {
                onChange?.(composeDateTime(dateStr, nextTime))
              }
            }}
            className="bg-card [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100"
          />
        </Field>
      </div>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </FieldGroup>
  )
}

export { BaseDatePickerTime }
