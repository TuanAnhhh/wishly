import * as React from "react"

import { cn } from "../../lib/utils"

type DiamondRuleProps = React.ComponentProps<"div"> & {
  /** Diamond fill — defaults to primary accent */
  color?: string
  /** Line fill — defaults to border */
  lineColor?: string
  /** Diamond side length in px. `0` hides the diamond (plain hairline). Defaults to 7. */
  size?: number
  /** Gap between line and diamond in px. Ignored when `size` is 0. Defaults to 12. */
  gap?: number
}

function DiamondRule({
  className,
  color = "var(--primary)",
  lineColor = "var(--border)",
  size = 7,
  gap = 12,
  style,
  ...props
}: DiamondRuleProps) {
  const showDiamond = size > 0
  return (
    <div
      data-slot="diamond-rule"
      role="separator"
      aria-hidden="true"
      className={cn("flex w-full items-center", className)}
      style={{ gap: showDiamond ? gap : 0, ...style }}
      {...props}
    >
      <span
        className="h-px min-w-0 flex-1"
        style={{ background: lineColor }}
      />
      {showDiamond && (
        <span
          className="shrink-0 rotate-45"
          style={{ background: color, width: size, height: size }}
        />
      )}
      <span
        className="h-px min-w-0 flex-1"
        style={{ background: lineColor }}
      />
    </div>
  )
}

export { DiamondRule }
export type { DiamondRuleProps }
