import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "w-full bg-[hsl(var(--bg-1))] border border-[hsl(var(--border))] rounded-lg text-sm font-mono text-center text-[hsl(var(--text))] focus:outline-none focus:ring-2 transition-all",
  {
    variants: {
      variant: {
        default: "focus:border-[hsl(var(--border-strong))]",
        fault: "focus:ring-[hsl(var(--status-fault))] focus:border-[hsl(var(--status-fault))]",
        success: "focus:ring-[hsl(var(--status-running))] focus:border-[hsl(var(--status-running))]",
        warning: "focus:ring-[hsl(var(--status-warning))] focus:border-[hsl(var(--status-warning))]",
      },
      size: {
        sm: "px-2 py-1 text-xs",
        default: "px-3 py-2 text-sm",
        lg: "px-4 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type ValidationType = "number" | "text" | "alphanumeric";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "min" | "max" | "size">,
    VariantProps<typeof inputVariants> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
  value?: string | number;
  onChange?: (value: string) => void;
  validation?: ValidationType;
  min?: number;
  max?: number;
  maxLength?: number;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, label, icon, error, value, onChange, validation = "text", min, max, maxLength, ...props }, ref) => {
    const [internalError, setInternalError] = React.useState<string>("");

    const validateInput = (inputValue: string): boolean => {
      if (validation === "number") {
        const num = Number(inputValue);
        if (inputValue !== "" && isNaN(num)) {
          setInternalError("Must be a number");
          return false;
        }
        if (min !== undefined && num < min) {
          setInternalError(`Must be at least ${min}`);
          return false;
        }
        if (max !== undefined && num > max) {
          setInternalError(`Must be at most ${max}`);
          return false;
        }
      } else if (validation === "text") {
        if (/\d/.test(inputValue)) {
          setInternalError("Numbers not allowed");
          return false;
        }
      } else if (validation === "alphanumeric") {
        if (!/^[a-zA-Z0-9]*$/.test(inputValue)) {
          setInternalError("Only letters and numbers allowed");
          return false;
        }
      }

      if (maxLength !== undefined && inputValue.length > maxLength) {
        setInternalError(`Maximum ${maxLength} characters`);
        return false;
      }

      setInternalError("");
      return true;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value;

      // Apply input filtering based on validation type
      if (validation === "number") {
        // Allow negative numbers, decimals, and numbers
        inputValue = inputValue.replace(/[^0-9.-]/g, "");
        // Prevent multiple decimals and minus signs
        const parts = inputValue.split(".");
        if (parts.length > 2) {
          inputValue = parts[0] + "." + parts.slice(1).join("");
        }
        if ((inputValue.match(/-/g) || []).length > 1) {
          inputValue = inputValue.replace(/-/g, "") + "-";
        }
      } else if (validation === "text") {
        // Remove numbers
        inputValue = inputValue.replace(/\d/g, "");
      } else if (validation === "alphanumeric") {
        // Remove special characters
        inputValue = inputValue.replace(/[^a-zA-Z0-9]/g, "");
      }

      validateInput(inputValue);
      onChange?.(inputValue);
    };

    const displayError = error || internalError;

    return (
      <div className="flex flex-col gap-1">
        {(label || icon) && (
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-1 sm:mb-1.5">
            {icon}
            <span className="text-[9px] sm:text-[10px] text-[hsl(var(--text-dim))] uppercase tracking-wider font-semibold">{label}</span>
          </div>
        )}
        <input
          ref={ref}
          type="text"
          value={value ?? ""}
          onChange={handleChange}
          className={cn(inputVariants({ variant, size, className }))}
          maxLength={maxLength}
          {...props}
        />
        {displayError && (
          <span className="text-[9px] sm:text-[10px] text-[hsl(var(--status-fault))] text-center">{displayError}</span>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input, inputVariants };
