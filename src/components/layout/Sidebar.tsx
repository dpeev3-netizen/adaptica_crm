"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  Briefcase,
  CheckSquare,
  Calendar,
  MessageCircle,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Cold Leads", href: "/leads/cold", icon: UserPlus },
  { name: "Warm Leads", href: "/leads/warm", icon: Users },
  { name: "Deals", href: "/deals", icon: Briefcase },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Chat", href: "/chat", icon: MessageCircle },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Don't render sidebar on auth pages
  if (pathname === "/login" || pathname === "/register") return null;

  const userName = session?.user?.name || "Admin User";
  const userInitials = userName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 flex flex-col bg-surface overflow-y-auto z-20 shadow-neumorph-flat">
      <div className="p-8 flex items-center justify-center">
        <h1 className="text-2xl font-black text-foreground drop-shadow-sm tracking-tight">
          Adaptica<span className="text-primary">CRM</span>
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 mt-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 font-medium text-sm ${
                isActive
                  ? "shadow-neumorph-pressed text-primary"
                  : "text-foreground opacity-80 hover:opacity-100 hover:shadow-neumorph-flat-sm"
              }`}
            >
              <Icon size={18} className={isActive ? "text-primary" : "text-muted"} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto space-y-3">
        <div className="w-full p-3 rounded-xl shadow-neumorph-pressed flex items-center gap-3">
          <div className="w-10 h-10 rounded-full shadow-neumorph-flat-sm border-[3px] border-surface flex items-center justify-center bg-primary text-white font-bold text-xs">
            {userInitials}
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-bold text-foreground truncate">{userName}</span>
            <span className="text-xs text-muted font-medium truncate">{session?.user?.email || "Workspace Admin"}</span>
          </div>
        </div>

        {session && (
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-muted hover:text-danger hover:shadow-neumorph-flat-sm transition-all"
          >
            <LogOut size={16} /> Sign Out
          </button>
        )}
      </div>
    </aside>
  );
}
