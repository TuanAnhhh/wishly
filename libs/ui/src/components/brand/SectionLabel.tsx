import * as React from "react"

import { cn } from "../../lib/utils"

type SectionLabelProps = React.ComponentProps<"p"> & {
  as?: "p" | "span" | "h2" | "h3" | "div"
}

function SectionLabel({
  as: Comp = "p",
  className,
  ...props
}: SectionLabelProps) {
  return (
    <Comp
      data-slot="section-label"
      className={cn(
        "text-[12px] leading-[1.5] font-semibold tracking-micro text-muted-foreground uppercase",
        className,
      )}
      {...props}
    />
  )
}

export { SectionLabel }
export type { SectionLabelProps }
