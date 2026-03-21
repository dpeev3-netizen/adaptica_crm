import { ReactNode } from "react";

interface NeoCardProps {
  children: ReactNode;
  className?: string;
  variant?: "elevated" | "filled" | "outlined";
}

export default function NeoCard({
  children,
  className = "",
  variant = "elevated",
}: NeoCardProps) {
  const variantClasses: Record<string, string> = {
    elevated:
      "bg-surface-container-low shadow-[var(--shadow-elevation-1)] border border-transparent",
    filled:
      "bg-surface-container-highest border border-transparent",
    outlined:
      "bg-surface border border-outline-variant",
  };

  return (
    <div
      className={`rounded-xl p-5 transition-all duration-200 ${variantClasses[variant] || variantClasses.elevated} ${className}`}
    >
      {children}
    </div>
  );
}
