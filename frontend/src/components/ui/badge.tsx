import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-neutral-200 bg-white text-neutral-900 hover:border-neutral-300 hover:bg-neutral-50",
        secondary:
          "border-neutral-200 bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
        destructive:
          "border-red-200 bg-red-50 text-red-900 hover:bg-red-100",
        outline:
          "border-neutral-300 text-neutral-700 bg-transparent hover:bg-neutral-50",
        success:
          "border-green-200 bg-green-50 text-green-900 hover:bg-green-100",
        warning:
          "border-yellow-200 bg-yellow-50 text-yellow-900 hover:bg-yellow-100",
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
