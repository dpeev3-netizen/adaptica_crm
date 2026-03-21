"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, Building2, Briefcase, LayoutDashboard, Target, CheckSquare, Calendar, BarChart3, Settings, MessageSquare, Workflow } from "lucide-react";
import { Command } from "cmdk";
import { fetchWithToken } from '@/lib/api';

const STATIC_LINKS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Target, label: "Leads", href: "/leads/cold" },
  { icon: Briefcase, label: "Deals Pipeline", href: "/deals" },
  { icon: Users, label: "Contacts", href: "/contacts" },
  { icon: CheckSquare, label: "Tasks", href: "/tasks" },
  { icon: Calendar, label: "Calendar", href: "/calendar" },
  { icon: MessageSquare, label: "Chat", href: "/chat" },
  { icon: Workflow, label: "Automations", href: "/automation-hub/automations" },
  { icon: BarChart3, label: "Reports", href: "/reports" },
  { icon: Settings, label: "Settings", href: "/settings/custom-fields" },
];

export default function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>({ contacts: [], companies: [], deals: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults({ contacts: [], companies: [], deals: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetchWithToken(`/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
      } catch {
        setResults({ contacts: [], companies: [], deals: [] });
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const navigate = (path: string) => {
    router.push(path);
    setIsOpen(false);
    setQuery("");
  };

  if (!isOpen) return null;

  return (
    <>
      {/* M3 Scrim */}
      <div
        className="fixed inset-0 bg-on-surface/30 z-[100] flex items-start justify-center pt-[15vh] animate-fade-in"
        onClick={() => setIsOpen(false)}
      >
        <div
          className="w-full max-w-2xl bg-surface-container-highest rounded-[28px] overflow-hidden shadow-[var(--shadow-elevation-3)] border border-outline-variant"
          onClick={(e) => e.stopPropagation()}
        >
          <Command
            label="Global Command Menu"
            shouldFilter={query.length < 2}
            onKeyDown={(e) => {
              if (e.key === "Escape") setIsOpen(false);
            }}
            className="flex flex-col h-full max-h-[60vh]"
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-outline-variant">
              <Search size={20} className="text-primary shrink-0" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Type a command or search records..."
                className="flex-1 bg-transparent text-on-surface font-medium text-lg placeholder:text-on-surface-variant/50 focus:outline-none"
                autoFocus
              />
            </div>

            <Command.List className="overflow-y-auto p-2">
              {loading && <Command.Loading className="p-4 text-center text-primary text-sm font-medium animate-pulse">Searching...</Command.Loading>}

              {!loading && query.length > 0 && results.contacts.length === 0 && results.companies.length === 0 && results.deals.length === 0 && (
                <Command.Empty className="p-12 text-center text-on-surface-variant text-sm flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-2">
                    <Search size={24} className="opacity-50" />
                  </div>
                  No results found for &quot;{query}&quot;
                </Command.Empty>
              )}

              {query.length < 2 && (
                <Command.Group heading="Navigation" className="px-2 py-2 md-label-medium text-on-surface-variant uppercase tracking-wider">
                  {STATIC_LINKS.map((link) => (
                    <Command.Item
                      key={link.href}
                      onSelect={() => navigate(link.href)}
                      className="px-4 py-3 my-0.5 flex items-center gap-3 rounded-xl cursor-pointer hover:bg-on-surface/5 aria-selected:bg-secondary-container aria-selected:text-on-secondary-container transition-all text-on-surface group"
                    >
                      <link.icon size={18} className="text-on-surface-variant group-aria-selected:text-on-secondary-container transition-colors shrink-0" />
                      <span className="font-medium text-sm">{link.label}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {results.contacts.length > 0 && (
                <Command.Group heading="Contacts" className="px-2 py-2 md-label-medium text-on-surface-variant uppercase tracking-wider mt-2">
                  {results.contacts.map((c: any) => (
                    <Command.Item
                      key={`contact-${c.id}`}
                      onSelect={() => navigate(`/contacts/${c.id}`)}
                      className="px-4 py-3 my-0.5 flex items-center gap-3 rounded-xl cursor-pointer hover:bg-on-surface/5 aria-selected:bg-secondary-container aria-selected:text-on-secondary-container transition-all"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                        <Users size={14} className="text-on-primary-container" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-on-surface text-sm truncate">{c.name}</p>
                        <p className="text-xs text-on-surface-variant truncate">{c.company?.name || "No Company"} {c.email ? `• ${c.email}` : ""}</p>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {results.companies.length > 0 && (
                <Command.Group heading="Companies" className="px-2 py-2 md-label-medium text-on-surface-variant uppercase tracking-wider mt-2">
                  {results.companies.map((c: any) => (
                    <Command.Item
                      key={`company-${c.id}`}
                      onSelect={() => navigate("/")}
                      className="px-4 py-3 my-0.5 flex items-center gap-3 rounded-xl cursor-pointer hover:bg-on-surface/5 aria-selected:bg-tertiary-container aria-selected:text-on-tertiary-container transition-all"
                    >
                      <div className="w-8 h-8 rounded-full bg-tertiary-container flex items-center justify-center shrink-0">
                        <Building2 size={14} className="text-on-tertiary-container" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-on-surface text-sm truncate">{c.name}</p>
                        <p className="text-xs text-on-surface-variant truncate">{c.industry || c.domain || "Company"}</p>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {results.deals.length > 0 && (
                <Command.Group heading="Deals" className="px-2 py-2 md-label-medium text-on-surface-variant uppercase tracking-wider mt-2">
                  {results.deals.map((d: any) => (
                    <Command.Item
                      key={`deal-${d.id}`}
                      onSelect={() => navigate("/deals")}
                      className="px-4 py-3 my-0.5 flex items-center gap-3 rounded-xl cursor-pointer hover:bg-on-surface/5 aria-selected:bg-warning-container aria-selected:text-on-warning-container transition-all"
                    >
                      <div className="w-8 h-8 rounded-full bg-warning-container flex items-center justify-center shrink-0">
                        <Briefcase size={14} className="text-on-warning-container" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-on-surface text-sm truncate">{d.title}</p>
                        <p className="text-xs text-on-surface-variant truncate">{d.company?.name || "Deal"} • ${Number(d.value).toLocaleString()}</p>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
            </Command.List>

            <div className="border-t border-outline-variant p-3 flex items-center justify-center gap-4 bg-surface-container">
              <div className="flex items-center gap-1.5 md-label-small text-on-surface-variant">
                <kbd className="px-1.5 py-0.5 rounded-md border border-outline-variant bg-surface-container-highest text-on-surface">↑</kbd>
                <kbd className="px-1.5 py-0.5 rounded-md border border-outline-variant bg-surface-container-highest text-on-surface">↓</kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1.5 md-label-small text-on-surface-variant">
                <kbd className="px-1.5 py-0.5 rounded-md border border-outline-variant bg-surface-container-highest text-on-surface">Enter</kbd>
                <span>Select</span>
              </div>
              <div className="flex items-center gap-1.5 md-label-small text-on-surface-variant">
                <kbd className="px-1.5 py-0.5 rounded-md border border-outline-variant bg-surface-container-highest text-on-surface">Esc</kbd>
                <span>Close</span>
              </div>
            </div>
          </Command>
        </div>
      </div>
    </>
  );
}
