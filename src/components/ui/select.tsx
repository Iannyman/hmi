"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export function Select({ options, value, onChange, label, className }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Calculate dropdown position when opening
  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        selectRef.current &&
        !selectRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update position on scroll/resize
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleScroll = () => {
        updatePosition();
      };
      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleScroll);
      return () => {
        window.removeEventListener("scroll", handleScroll, true);
        window.removeEventListener("resize", handleScroll);
      };
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={selectRef}>
      {label && (
        <label className="text-xs uppercase tracking-wider text-[hsl(var(--text-dim))] mr-2">
          {label}:
        </label>
      )}
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => {
            updatePosition();
            setIsOpen(!isOpen);
          }}
          className={cn(
            "flex items-center justify-between w-full bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-lg px-4 py-2.5 text-sm text-left transition-colors hover:border-[hsl(var(--border-strong))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--border-accent))]/20",
            isOpen && "border-[hsl(var(--border-strong))] ring-2 ring-[hsl(var(--border-accent))]/20",
            className
          )}
        >
          <span className="truncate">{selectedOption?.label || "Select..."}</span>
          <ChevronDown
            className={cn(
              "w-4 h-4 ml-3 flex-shrink-0 text-[hsl(var(--text-muted))] transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {isOpen &&
          createPortal(
            <div
              ref={dropdownRef}
              className="fixed z-[9999] bg-[hsl(var(--bg-card))] border border-[hsl(var(--border))] rounded-lg shadow-lg overflow-hidden"
              style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                width: `${position.width}px`,
              }}
            >
              <div className="py-1 max-h-90 overflow-y-auto">
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full px-4 py-2.5 text-sm text-left transition-colors hover:bg-[hsl(var(--surface-hover))] focus:outline-none focus:bg-[hsl(var(--surface-hover))]",
                      option.value === value &&
                        "bg-[hsl(var(--surface))] text-[hsl(var(--text-primary))]"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>,
            document.body
          )}
      </div>
    </div>
  );
}
