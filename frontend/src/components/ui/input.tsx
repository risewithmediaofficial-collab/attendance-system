import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-black/12 bg-white/75 backdrop-blur-md px-4 py-2.5 text-sm font-medium text-black/90 ring-offset-background transition-all duration-300 file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-black/80 placeholder:text-black/40 focus-visible:outline-none focus-visible:border-black/25 focus-visible:bg-white/92 focus-visible:ring-2 focus-visible:ring-black/15 focus-visible:ring-offset-0 hover:border-black/22 hover:bg-white/85 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
