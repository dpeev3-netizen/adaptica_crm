"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface NeoInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const NeoInput = forwardRef<HTMLInputElement, NeoInputProps>(
  ({ label, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5 w-full relative">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-on-surface-variant ml-0.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-4 py-2.5 rounded-2xl bg-surface-container-highest border-none text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-sm font-normal ${className}`}
          {...props}
        />
      </div>
    );
  }
);

NeoInput.displayName = "NeoInput";

export default NeoInput;
