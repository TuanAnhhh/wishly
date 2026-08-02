"use client"

import type { CSSProperties } from "react"
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ theme = "light", ...props }: ToasterProps) => {
  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={{
        success: <CheckCircleIcon className="size-4" aria-hidden="true" />,
        info: <InformationCircleIcon className="size-4" aria-hidden="true" />,
        warning: (
          <ExclamationTriangleIcon className="size-4" aria-hidden="true" />
        ),
        error: <XCircleIcon className="size-4" aria-hidden="true" />,
        loading: (
          <ArrowPathIcon className="size-4 animate-spin" aria-hidden="true" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
export { toast } from "sonner"
