import { ReactNode } from "react";

interface NeoCardProps {
  children: ReactNode;
  className?: string;
  variant?: "flat" | "pressed";
}

export default function NeoCard({
  children,
  className = "",
  variant = "flat",
}: NeoCardProps) {
  const shadowClass =
    variant === "pressed" ? "shadow-neumorph-pressed" : "shadow-neumorph-flat";

  return (
    <div
      className={`rounded-2xl p-6 bg-surface ${shadowClass} ${className}`}
    >
      {children}
    </div>
  );
}
