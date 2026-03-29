import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs sm:text-sm font-medium ring-offset-background transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-status-fault text-white hover:bg-status-fault/90",
        outline: "border border-border bg-transparent hover:bg-surface-1 hover:text-text-primary",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-surface-1 hover:text-text-primary",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-status-running text-white hover:bg-status-running/90",
        emergency: "bg-status-fault text-white text-base sm:text-lg font-bold h-12 sm:h-14 px-6 sm:px-8 animate-pulse-fast hover:bg-status-fault/90",
      },
      size: {
        default: "h-10 sm:h-12 px-4 sm:px-6 py-2 sm:py-3",
        sm: "h-9 sm:h-10 rounded-md px-3 sm:px-4",
        lg: "h-12 sm:h-14 rounded-md px-8 sm:px-10",
        icon: "h-10 w-10 sm:h-12 sm:w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
