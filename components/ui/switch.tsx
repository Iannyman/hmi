"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SwitchProps extends React.HTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked = false, onCheckedChange, disabled = false, ...props }, ref) => {
    const handleClick = () => {
      if (!disabled) {
        onCheckedChange?.(!checked);
      }
    };

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          "peer inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
          checked
            ? "bg-accent border-transparent"
            : "bg-background border-border hover:border-border-strong",
          className
        )}
        {...props}
      >
        <span
          className={cn(
            "pointer-events-none block h-6 w-6 rounded-full bg-background shadow-lg ring-0 transition-transform",
            checked
              ? "translate-x-6 bg-white"
              : "translate-x-0 bg-foreground"
          )}
        />
      </button>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };
