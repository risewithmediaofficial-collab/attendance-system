import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold tracking-wide ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/35 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-black to-zinc-700 text-white shadow-[0_8px_22px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_4px_12px_rgba(0,0,0,0.28)]",
        destructive:
          "bg-gradient-to-r from-zinc-900 to-zinc-700 text-white shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.42)] hover:-translate-y-0.5 active:translate-y-0",
        outline:
          "border border-black/15 bg-white/70 backdrop-blur-md text-black/80 hover:bg-white/90 hover:border-black/30 hover:text-black hover:shadow-[0_6px_20px_rgba(0,0,0,0.16)] hover:-translate-y-0.5",
        secondary:
          "bg-zinc-100/80 backdrop-blur-sm text-black/80 border border-black/10 hover:bg-zinc-200/70 hover:border-black/20 hover:shadow-[0_4px_14px_rgba(0,0,0,0.12)] hover:-translate-y-0.5",
        ghost:
          "text-black/70 hover:bg-black/5 hover:text-black transition-colors rounded-xl",
        link: "text-black/70 underline-offset-4 hover:underline hover:text-black",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
