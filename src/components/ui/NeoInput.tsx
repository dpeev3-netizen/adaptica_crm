"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface NeoInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const NeoInput = forwardRef<HTMLInputElement, NeoInputProps>(
  ({ label, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-foreground opacity-70 ml-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-4 py-2.5 rounded-xl bg-surface shadow-neumorph-concave text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all duration-200 ${className}`}
          {...props}
        />
      </div>
    );
  }
);

NeoInput.displayName = "NeoInput";

export default NeoInput;
