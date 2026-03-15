"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, Building2, Briefcase, X } from "lucide-react";

export default function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>({ contacts: [], companies: [], deals: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults({ contacts: [], companies: [], deals: [] });
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults({ contacts: [], companies: [], deals: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
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
  };

  const hasResults = results.contacts.length > 0 || results.companies.length > 0 || results.deals.length > 0;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" onClick={() => setIsOpen(false)} />

      {/* Modal */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl z-50">
        <div className="bg-surface rounded-2xl shadow-neumorph-flat overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-background/50">
            <Search size={20} className="text-muted shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search contacts, companies, deals..."
              className="flex-1 bg-transparent text-foreground font-medium text-base placeholder:text-muted focus:outline-none"
            />
            <button onClick={() => setIsOpen(false)} className="text-muted hover:text-foreground">
              <X size={18} />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading && (
              <div className="p-6 text-center text-muted text-sm">Searching...</div>
            )}

            {!loading && query.length >= 2 && !hasResults && (
              <div className="p-6 text-center text-muted text-sm">No results found for &quot;{query}&quot;</div>
            )}

            {!loading && hasResults && (
              <div className="py-2">
                {results.contacts.length > 0 && (
                  <div>
                    <p className="px-5 py-2 text-xs font-bold text-muted uppercase tracking-wider">Contacts</p>
                    {results.contacts.map((c: any) => (
                      <button
                        key={c.id}
                        onClick={() => navigate(`/contacts/${c.id}`)}
                        className="w-full px-5 py-3 flex items-center gap-3 hover:bg-background/30 transition-colors text-left"
                      >
                        <Users size={16} className="text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">{c.name}</p>
                          <p className="text-xs text-muted truncate">{c.company?.name} {c.email ? `• ${c.email}` : ""}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {results.companies.length > 0 && (
                  <div>
                    <p className="px-5 py-2 text-xs font-bold text-muted uppercase tracking-wider">Companies</p>
                    {results.companies.map((c: any) => (
                      <button
                        key={c.id}
                        onClick={() => navigate("/")}
                        className="w-full px-5 py-3 flex items-center gap-3 hover:bg-background/30 transition-colors text-left"
                      >
                        <Building2 size={16} className="text-success shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">{c.name}</p>
                          <p className="text-xs text-muted truncate">{c.industry || c.domain || ""}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {results.deals.length > 0 && (
                  <div>
                    <p className="px-5 py-2 text-xs font-bold text-muted uppercase tracking-wider">Deals</p>
                    {results.deals.map((d: any) => (
                      <button
                        key={d.id}
                        onClick={() => navigate("/deals")}
                        className="w-full px-5 py-3 flex items-center gap-3 hover:bg-background/30 transition-colors text-left"
                      >
                        <Briefcase size={16} className="text-warning shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">{d.title}</p>
                          <p className="text-xs text-muted truncate">{d.company?.name} • ${Number(d.value).toLocaleString()}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!loading && query.length < 2 && (
              <div className="p-6 text-center text-muted text-sm">
                Type at least 2 characters to search...
                <p className="text-xs mt-1 opacity-60">Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-background/50 font-mono text-[10px]">Ctrl+K</kbd> to open anytime</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
