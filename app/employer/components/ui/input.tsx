import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-[#cedae6] bg-white px-3.5 py-2 text-sm text-[#24364a] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-[#8a9aae] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6fa4]/20 focus-visible:border-[#2f6fa4] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }

