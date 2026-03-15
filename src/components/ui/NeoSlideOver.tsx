"use client";

import { ReactNode } from "react";
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* SlideOver Panel */}
      <div className="relative w-full max-w-md h-full bg-surface shadow-neumorph-flat animate-in fade-in slide-in-from-right-full duration-300 flex flex-col pointer-events-auto">
        {/* Header */}
        <div className="px-6 py-5 border-b-2 border-background/50 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-black text-foreground drop-shadow-sm tracking-tight pr-4">
              {title}
            </h2>
            {subtitle && <p className="text-sm font-medium text-muted mt-1">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-muted hover:text-danger shadow-neumorph-flat-sm active:shadow-neumorph-pressed transition-all duration-200"
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
