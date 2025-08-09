import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-white/10 bg-transparent px-4 py-2",
          "transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "text-foreground/90 dark:text-white", // Explicit text color with high contrast in dark mode
          "placeholder:text-muted-foreground dark:placeholder:text-gray-400", // Brighter placeholder text in dark mode
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:border-primary/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
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
