import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-black/18 bg-white/72 text-black/82 backdrop-blur-sm hover:border-black/28 hover:bg-white/88",
        secondary:
          "border-black/14 bg-zinc-100/75 text-black/68 backdrop-blur-sm hover:bg-zinc-200/70",
        destructive:
          "border-black/22 bg-black/12 text-black/86 backdrop-blur-sm hover:bg-black/20",
        outline:
          "border-black/24 text-black/75 bg-transparent hover:bg-black/5",
        success:
          "border-black/18 bg-white/70 text-black/78 backdrop-blur-sm hover:bg-zinc-100/70",
        warning:
          "border-black/20 bg-zinc-100/75 text-black/74 backdrop-blur-sm hover:bg-zinc-200/70",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
