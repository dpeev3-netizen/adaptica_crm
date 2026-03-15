"use client";

import { ReactNode } from "react";

interface NeoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function NeoModal({ isOpen, onClose, title, children }: NeoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-surface p-6 rounded-3xl shadow-neumorph-flat animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-xl font-bold text-foreground mb-4 pr-8">{title}</h3>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-danger hover:shadow-neumorph-pressed transition-all duration-200"
        >
          ✕
        </button>

        <div className="mt-4">
          {children}
        </div>
      </div>
    </div>
  );
}
