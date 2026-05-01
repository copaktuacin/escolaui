import { CheckCircle2, XCircle } from "lucide-react";
import type * as React from "react";
import { useState } from "react";

import { cn } from "@/lib/utils";

/* ── Base Input ─────────────────────────────────────────────────────────── */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-all duration-200 outline-none",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20",
        "aria-invalid:border-destructive/50 aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        className,
      )}
      {...props}
    />
  );
}

/* ── FloatingInput ──────────────────────────────────────────────────────── */
interface FloatingInputProps extends React.ComponentProps<"input"> {
  label: string;
  error?: string;
  success?: boolean;
  hint?: string;
}

function FloatingInput({
  label,
  error,
  success,
  hint,
  className,
  id,
  value,
  defaultValue,
  onChange,
  onFocus,
  onBlur,
  ...props
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const [internalValue, setInternalValue] = useState<string>(
    (defaultValue as string) ?? "",
  );

  const isControlled = value !== undefined;
  const currentValue = isControlled ? String(value ?? "") : internalValue;
  const hasValue = currentValue.length > 0;
  const floated = focused || hasValue;

  const inputId = id ?? `floating-${label.toLowerCase().replace(/\s+/g, "-")}`;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!isControlled) setInternalValue(e.target.value);
    onChange?.(e);
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <input
          id={inputId}
          data-slot="floating-input"
          value={isControlled ? value : internalValue}
          onChange={handleChange}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          placeholder=" "
          className={cn(
            "peer block w-full rounded-lg border bg-background px-3 pt-5 pb-2 text-sm",
            "transition-all duration-200 outline-none shadow-xs",
            "placeholder-transparent",
            focused
              ? error
                ? "border-destructive/50 ring-2 ring-destructive/20"
                : "border-primary/50 ring-2 ring-primary/20"
              : error
                ? "border-destructive/40"
                : success
                  ? "border-success/50"
                  : "border-input",
            "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        />
        <label
          htmlFor={inputId}
          className={cn(
            "pointer-events-none absolute left-3 transition-all duration-200 origin-left select-none",
            floated
              ? "top-1.5 text-[10px] font-semibold"
              : "top-1/2 -translate-y-1/2 text-sm",
            focused
              ? error
                ? "text-destructive"
                : "text-primary"
              : error
                ? "text-destructive/70"
                : success
                  ? "text-success"
                  : "text-muted-foreground",
          )}
        >
          {label}
        </label>
        {(success || error) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {error ? (
              <XCircle className="w-4 h-4 text-destructive" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-success" />
            )}
          </div>
        )}
      </div>
      {(error || hint) && (
        <p
          className={cn(
            "text-xs px-1",
            error ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

export { Input, FloatingInput };
