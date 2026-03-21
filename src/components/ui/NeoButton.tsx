"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

interface NeoButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "filled" | "tonal" | "outlined" | "text" | "danger" | "fab" | "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

// Map legacy variant names to M3 equivalents
const VARIANT_ALIASES: Record<string, string> = {
  primary: "filled",
  secondary: "tonal",
  ghost: "text",
};

export default function NeoButton({
  children,
  variant = "filled",
  size = "md",
  className = "",
  ...props
}: NeoButtonProps) {
  const resolvedVariant = VARIANT_ALIASES[variant] || variant;

  const baseClasses =
    "inline-flex items-center justify-center gap-2 font-medium md-label-large rounded-full transition-all duration-200 ease-in-out active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 select-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

  const sizeClasses: Record<string, string> = {
    sm: "px-4 py-1.5 text-xs",
    md: "px-6 py-2.5 text-sm",
    lg: "px-8 py-3 text-base",
  };

  const variantClasses: Record<string, string> = {
    filled:
      "bg-primary text-on-primary hover:shadow-[var(--shadow-elevation-1)] hover:brightness-110",
    tonal:
      "bg-primary-container text-on-primary-container hover:shadow-[var(--shadow-elevation-1)] hover:brightness-105",
    outlined:
      "bg-transparent text-primary border border-outline hover:bg-primary/8",
    text:
      "bg-transparent text-primary hover:bg-primary/8",
    danger:
      "bg-error-container text-on-error-container hover:shadow-[var(--shadow-elevation-1)] hover:brightness-105",
    fab:
      "bg-primary-container text-on-primary-container rounded-2xl px-5 py-3.5 shadow-[var(--shadow-elevation-3)] hover:shadow-[var(--shadow-elevation-4)] font-medium",
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${variantClasses[resolvedVariant] || variantClasses.filled} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
