"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Briefcase,
  CheckSquare,
  Calendar,
  MessageCircle,
  BarChart3,
  Settings,
  LogOut,
  Zap,
  Globe,
  Puzzle,
  GitBranch,
  Snowflake,
  Flame,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";
import { useAuth } from "@/store/useAuth";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "Deals", href: "/deals", icon: Briefcase },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Chat", href: "/chat", icon: MessageCircle },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Automation Hub", href: "/automation-hub", icon: Zap },
  { name: "Settings", href: "/settings", icon: Settings },
];

const LEADS_SUB_ITEMS = [
  { name: "Cold Leads", href: "/leads/cold", icon: Snowflake },
  { name: "Warm Leads", href: "/leads/warm", icon: Flame },
];

const SETTINGS_SUB_ITEMS = [
  { name: "General", href: "/settings", icon: Settings },
];

const AUTOMATION_SUB_ITEMS = [
  { name: "API Keys", href: "/automation-hub/api-keys", icon: Zap },
  { name: "Automations", href: "/automation-hub/automations", icon: Zap },
  { name: "Webhooks", href: "/automation-hub/webhooks", icon: Globe },
  { name: "Integrations", href: "/automation-hub/integrations", icon: Puzzle },
  { name: "Pipelines", href: "/automation-hub/pipelines", icon: GitBranch },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  // Persist collapse state
  useEffect(() => {
    const stored = localStorage.getItem("crm-sidebar-collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("crm-sidebar-collapsed", String(next));
    // Dispatch custom event so layout.tsx can respond
    window.dispatchEvent(new CustomEvent("sidebar-toggle", { detail: { collapsed: next } }));
  };

  if (pathname === "/login") return null;

  const userName = user?.name || "Admin User";
  const userInitials = userName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const isSettingsOpen = pathname.startsWith("/settings");
  const isLeadsOpen = pathname.startsWith("/leads");
  const isAutomationOpen = pathname.startsWith("/automation-hub");

  const sidebarWidth = collapsed ? "w-[72px]" : "w-[280px]";

  return (
    <aside className={`${sidebarWidth} h-screen fixed left-0 top-0 flex flex-col bg-surface-container-low overflow-y-auto overflow-x-hidden z-20 md-transition-emphasized`}>
      {/* Logo / Brand */}
      <div className={`flex items-center ${collapsed ? "justify-center px-2" : "px-6"} h-16`}>
        {collapsed ? (
          <button
            onClick={toggleCollapse}
            className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-on-surface/8 transition-colors"
          >
            <Menu size={22} />
          </button>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                <LayoutDashboard className="text-on-primary" size={16} />
              </div>
              <span className="md-title-medium text-on-surface font-semibold">
                Adaptica<span className="text-primary">CRM</span>
              </span>
            </div>
            <button
              onClick={toggleCollapse}
              className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-on-surface/8 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className={`${collapsed ? "mx-2" : "mx-4"} h-px bg-outline-variant`} />

      {/* Navigation */}
      <nav className={`flex-1 ${collapsed ? "px-2" : "px-3"} py-2 space-y-0.5 mt-1`}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                title={collapsed ? item.name : undefined}
                className={`flex items-center gap-3 ${collapsed ? "justify-center px-0 py-2.5" : "px-4 py-2.5"} rounded-full transition-all duration-200 md-label-large relative ${
                  isActive
                    ? "bg-primary-container text-on-primary-container font-medium"
                    : "text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                <Icon size={20} className={`shrink-0 ${isActive ? "text-on-primary-container" : ""}`} />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </Link>

              {/* Sub-items — only show when expanded */}
              {!collapsed && item.href === "/leads" && isLeadsOpen && (
                <div className="ml-8 mt-0.5 space-y-0.5">
                  {LEADS_SUB_ITEMS.map((sub) => {
                    const SubIcon = sub.icon;
                    const subActive = pathname === sub.href;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={`flex items-center gap-2.5 px-4 py-2 rounded-full text-sm transition-all duration-200 ${
                          subActive
                            ? "text-on-primary-container bg-primary-container/60 font-medium"
                            : "text-on-surface-variant hover:bg-surface-container"
                        }`}
                      >
                        <SubIcon size={16} />
                        {sub.name}
                      </Link>
                    );
                  })}
                </div>
              )}

              {!collapsed && item.href === "/settings" && isSettingsOpen && (
                <div className="ml-8 mt-0.5 space-y-0.5">
                  {SETTINGS_SUB_ITEMS.map((sub) => {
                    const SubIcon = sub.icon;
                    const subActive = pathname === sub.href;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={`flex items-center gap-2.5 px-4 py-2 rounded-full text-sm transition-all duration-200 ${
                          subActive
                            ? "text-on-primary-container bg-primary-container/60 font-medium"
                            : "text-on-surface-variant hover:bg-surface-container"
                        }`}
                      >
                        <SubIcon size={16} />
                        {sub.name}
                      </Link>
                    );
                  })}
                </div>
              )}

              {!collapsed && item.href === "/automation-hub" && isAutomationOpen && (
                <div className="ml-8 mt-0.5 space-y-0.5">
                  {AUTOMATION_SUB_ITEMS.map((sub) => {
                    const SubIcon = sub.icon;
                    const subActive = pathname === sub.href;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={`flex items-center gap-2.5 px-4 py-2 rounded-full text-sm transition-all duration-200 ${
                          subActive
                            ? "text-on-primary-container bg-primary-container/60 font-medium"
                            : "text-on-surface-variant hover:bg-surface-container"
                        }`}
                      >
                        <SubIcon size={16} />
                        {sub.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Card — Bottom */}
      <div className={`${collapsed ? "p-2" : "p-3"} mt-auto space-y-2`}>
        <div className={`w-full ${collapsed ? "p-2 justify-center" : "p-3"} rounded-2xl bg-surface-container flex items-center gap-3`}>
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary font-medium text-xs shrink-0">
            {userInitials}
          </div>
          {!collapsed && (
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium text-on-surface truncate">{userName}</span>
              <span className="text-xs text-on-surface-variant truncate">{user?.email || "Workspace Admin"}</span>
            </div>
          )}
        </div>

        {user && (
          <button
            onClick={() => { logout(); router.push('/login'); }}
            title={collapsed ? "Sign Out" : undefined}
            className={`w-full flex items-center ${collapsed ? "justify-center" : ""} gap-2 px-4 py-2 rounded-full text-sm font-medium text-on-surface-variant hover:text-error hover:bg-error/8 transition-all`}
          >
            <LogOut size={18} />
            {!collapsed && "Sign Out"}
          </button>
        )}
      </div>
    </aside>
  );
}
