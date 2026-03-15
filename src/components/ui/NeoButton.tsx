"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

interface NeoButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
}

export default function NeoButton({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: NeoButtonProps) {
  const baseClasses =
    "rounded-xl font-semibold transition-all duration-200 ease-in-out shadow-neumorph-flat-sm active:shadow-neumorph-pressed active:translate-y-0.5 focus:outline-none cursor-pointer select-none";

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3 text-base",
  };

  const variantClasses = {
    primary: "bg-primary text-white hover:bg-primary-dark",
    secondary: "bg-surface text-foreground hover:text-primary",
    danger: "bg-danger text-white hover:opacity-90",
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
