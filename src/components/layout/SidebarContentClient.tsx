"use client";

import { useState, useEffect, ReactNode } from "react";

export default function SidebarContentClient({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // Read initial state
    const stored = localStorage.getItem("crm-sidebar-collapsed");
    if (stored === "true") setCollapsed(true);

    // Listen for sidebar toggle events
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setCollapsed(detail.collapsed);
    };
    window.addEventListener("sidebar-toggle", handler);
    return () => window.removeEventListener("sidebar-toggle", handler);
  }, []);

  return (
    <div className={`flex-1 ${collapsed ? "ml-[72px]" : "ml-[280px]"} flex flex-col min-w-0 md-transition-emphasized`}>
      {children}
    </div>
  );
}
