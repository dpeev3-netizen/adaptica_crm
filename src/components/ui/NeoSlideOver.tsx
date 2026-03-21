"use client";

import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

interface NeoSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function NeoSlideOver({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}: NeoSlideOverProps) {
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

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* M3 Scrim */}
      <div
        className="absolute inset-0 bg-on-surface/30 animate-fade-in"
        onClick={onClose}
      />

      {/* M3 Side Sheet */}
      <div className="relative w-full max-w-md h-full bg-surface-container flex flex-col pointer-events-auto shadow-[var(--shadow-elevation-4)] animate-slide-up-fade">
        {/* Header */}
        <div className="px-6 py-5 border-b border-outline-variant flex items-start justify-between">
          <div>
            <h2 className="md-title-large text-on-surface pr-4">
              {title}
            </h2>
            {subtitle && <p className="md-body-medium text-on-surface-variant mt-1">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-on-surface/8 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
