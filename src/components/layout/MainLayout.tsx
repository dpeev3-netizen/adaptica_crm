"use client";

import { usePathname } from 'next/navigation';
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import CommandPalette from "@/components/layout/CommandPalette";
import SidebarContentClient from "@/components/layout/SidebarContentClient";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  if (pathname === '/login') {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  return (
    <div className="flex min-h-screen bg-surface transition-colors duration-300">
      <Sidebar />
      <SidebarContentClient>
        <Header />
        <main className="p-6 pb-12 max-w-[1600px] mx-auto w-full">
          {children}
        </main>
      </SidebarContentClient>
      <CommandPalette />
    </div>
  );
}
