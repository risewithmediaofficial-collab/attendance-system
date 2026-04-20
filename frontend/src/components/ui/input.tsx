import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 ring-offset-background transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-neutral-700 placeholder:text-neutral-400 focus-visible:outline-none focus-visible:border-[#4F6FAF] focus-visible:ring-2 focus-visible:ring-[#4F6FAF]/10 hover:border-neutral-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-50",
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
