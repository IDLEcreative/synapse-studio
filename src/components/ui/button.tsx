import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium",
    "transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
    "disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    "aria-disabled:opacity-50 aria-disabled:pointer-events-none",
    "shadow-sm hover:shadow-md backdrop-blur-sm",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 data-[state=open]:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-primary/30 bg-background/80 hover:border-primary/60 hover:bg-primary/5 hover:text-primary data-[state=open]:bg-primary/5",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/90 data-[state=open]:bg-secondary/90",
        ghost:
          "hover:bg-primary/10 hover:text-primary data-[state=open]:bg-primary/10",
        link: "text-primary underline-offset-4 hover:underline",
        glass:
          "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 shadow-lg",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-sm",
        lg: "h-11 rounded-md px-6 text-base",
        icon: "h-10 w-10",
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
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
