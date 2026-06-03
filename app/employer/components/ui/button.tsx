import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]/30 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-[0_10px_24px_rgba(35,91,142,0.16)] hover:-translate-y-0.5 hover:bg-[#214f7b]",
        destructive:
          "border border-[#ea7a6b] bg-[#ea7a6b] text-white shadow-[0_8px_18px_rgba(234,122,107,0.22)] hover:-translate-y-0.5 hover:bg-[#e26858]",
        outline:
          "border border-[#c9d7e6] bg-white text-[#2f5981] shadow-[0_4px_14px_rgba(47,89,129,0.08)] hover:-translate-y-0.5 hover:border-[#2f6fa4] hover:bg-[#f6f9fc]",
        secondary:
          "border border-[#d5e2ef] bg-[#eef5fb] text-[#2f5981] shadow-[0_4px_12px_rgba(47,89,129,0.08)] hover:-translate-y-0.5 hover:bg-[#e6f0f9]",
        ghost: "border border-transparent text-[#526579] hover:bg-[#eef4f9]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-10 px-4 py-2.5",
        sm: "min-h-8 rounded-lg px-3 text-xs",
        lg: "min-h-11 rounded-xl px-6 text-sm",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

