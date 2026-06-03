import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "whitespace-nowrap inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/30",
  {
    variants: {
      variant: {
        default:
          "border-[#2f6fa4] bg-[#2f6fa4] text-white",
        secondary:
          "border-[#d6e4f1] bg-[#eef5fb] text-[#315d86]",
        destructive:
          "border-[#f2b5ae] bg-[#fff2f0] text-[#bf4d40]",
        outline: "border-[#d2deea] bg-white text-[#516578]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

