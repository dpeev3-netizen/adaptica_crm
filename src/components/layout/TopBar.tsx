"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Bell, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

export default function TopBar() {
  const queryClient = useQueryClient();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // TODO: Replace with actual user ID from session
  const userId = "current-user";

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch(`/api/notifications?userId=${userId}`);
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 10000,
  });

  const markRead = useMutation({
    mutationFn: async (ids: string[]) => {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unreadCount = notifications?.filter((n: any) => !n.read)?.length || 0;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleBellClick = () => {
    setNotifOpen(!notifOpen);
    // Mark all as read when opening
    if (!notifOpen && unreadCount > 0) {
      const unreadIds = notifications.filter((n: any) => !n.read).map((n: any) => n.id);
      markRead.mutate(unreadIds);
    }
  };

  return (
    <header className="h-20 w-full flex flex-row items-center justify-between px-8 bg-surface z-10 sticky top-0 bg-opacity-90 backdrop-blur-sm">
      <div className="flex-1 max-w-xl">
        <button
          onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))}
          className="relative flex items-center w-full"
        >
          <div className="absolute left-4 text-muted pointer-events-none">
            <Search size={18} />
          </div>
          <div className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-surface shadow-neumorph-concave text-sm font-medium text-muted text-left cursor-pointer focus:outline-none">
            Search leads, deals, or contacts...
            <kbd className="ml-2 px-1.5 py-0.5 rounded bg-background/50 text-[10px] font-mono">Ctrl+K</kbd>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-6 ml-4 relative" ref={notifRef}>
        <button
          onClick={handleBellClick}
          className="w-10 h-10 rounded-full flex items-center justify-center text-muted hover:text-primary transition-colors shadow-neumorph-flat-sm active:shadow-neumorph-pressed relative"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Dropdown */}
        {notifOpen && (
          <div className="absolute right-0 top-14 w-80 bg-surface rounded-2xl shadow-neumorph-flat overflow-hidden z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-background/50">
              <span className="font-bold text-foreground text-sm">Notifications</span>
              <button onClick={() => setNotifOpen(false)} className="text-muted hover:text-foreground">
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {!notifications?.length ? (
                <div className="p-6 text-center text-muted text-sm">No notifications yet.</div>
              ) : (
                notifications.map((n: any) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-background/30 hover:bg-background/20 transition-colors ${
                      !n.read ? "bg-primary/5" : ""
                    }`}
                  >
                    <p className="text-sm font-semibold text-foreground">{n.title}</p>
                    <p className="text-xs text-muted mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-muted mt-1">
                      {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
