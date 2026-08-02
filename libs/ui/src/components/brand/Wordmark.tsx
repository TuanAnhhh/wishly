import * as React from "react"

import { cn } from "../../lib/utils"

type WordmarkProps = Omit<React.ComponentProps<"span">, "children"> & {
  as?: "span" | "p" | "h1" | "div"
  /** Pixel size — DS default header = 23 */
  size?: number
}

/**
 * Brand wordmark — Cormorant + tracking 0.05em.
 * No uppercase, no tagline beside it in headers (DS Wordmark.prompt).
 */
function Wordmark({
  as: Comp = "span",
  size = 23,
  className,
  style,
  ...props
}: WordmarkProps) {
  return (
    <Comp
      translate="no"
      data-slot="wordmark"
      className={cn(
        "font-serif leading-[1.2] tracking-wordmark text-foreground",
        className
      )}
      style={{ fontSize: size, ...style }}
      {...(props as React.ComponentPropsWithoutRef<typeof Comp>)}
    >
      Thiệp Việt
    </Comp>
  )
}

export { Wordmark }
export type { WordmarkProps }
