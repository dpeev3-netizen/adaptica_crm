"use client";

import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

interface NeoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

export default function NeoModal({ isOpen, onClose, title, children, size = "md" }: NeoModalProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  if (!isOpen) return null;

  const maxW = size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-2xl" : size === "xl" ? "max-w-5xl" : size === "full" ? "max-w-[90vw] xl:max-w-[1400px]" : "max-w-md";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* M3 Scrim */}
      <div
        className="absolute inset-0 bg-on-surface/30 animate-fade-in"
        onClick={onClose}
      />

      {/* M3 Dialog */}
      <div className={`relative w-full ${maxW} bg-surface-container-highest p-6 rounded-[28px] shadow-[var(--shadow-elevation-3)] animate-scale-in`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="md-headline-small text-on-surface font-medium">{title}</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-on-surface/8 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div>
          {children}
        </div>
      </div>
    </div>
  );
}
