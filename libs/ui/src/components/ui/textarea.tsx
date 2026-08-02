import * as React from "react"

import { cn } from "../../lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded-md border border-border-strong bg-card px-3 py-3 text-base shadow-none transition-[color,box-shadow,border-color] outline-none placeholder:text-secondary-foreground focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-accent-soft focus-visible:ring-offset-1 focus-visible:ring-offset-primary disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
