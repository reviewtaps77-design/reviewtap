"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft } from "lucide-react";

interface SearchEntry {
  title: string;
  section: string;
  keywords: string;
  href: string;
}

// Every owner page + jumpable subsection. Anchors must exist as element ids on the target page.
const INDEX: SearchEntry[] = [
  { title: "Overview", section: "Dashboard", keywords: "home dashboard stats counts", href: "/dashboard" },
  { title: "Employees", section: "Dashboard", keywords: "staff team members list", href: "/dashboard/employees" },
  { title: "Add employee", section: "Employees", keywords: "new staff create hire add member", href: "/dashboard/employees/add" },
  { title: "Compare employees", section: "Employees", keywords: "staff compare performance versus", href: "/dashboard/employees/compare" },
  { title: "Analytics", section: "Dashboard", keywords: "reports charts scans reviews graphs insights", href: "/dashboard/analytics" },
  { title: "Complaints inbox", section: "Complaints & Feedback", keywords: "complaints table spot list status new resolve", href: "/dashboard/complaints-and-feedback#complaints" },
  { title: "Private feedback inbox", section: "Complaints & Feedback", keywords: "feedback suggestions unread resolve private", href: "/dashboard/complaints-and-feedback#feedback" },
  { title: "Business QR code", section: "QR & NFC", keywords: "main primary qr download print business code", href: "/dashboard/qr-nfc#business-qr" },
  { title: "Staff QR codes", section: "QR & NFC", keywords: "employee qr download print staff codes", href: "/dashboard/qr-nfc#staff-qr" },
  { title: "Spots", section: "QR & NFC", keywords: "tables rooms counters spots branch add", href: "/dashboard/qr-nfc#spots" },
  { title: "Complaint QR codes", section: "QR & NFC", keywords: "table spot qr create download print disable", href: "/dashboard/qr-nfc#complaint-codes" },
  { title: "Complaint options", section: "QR & NFC", keywords: "complaint categories reasons customize reorder enable", href: "/dashboard/qr-nfc#complaint-options" },
  { title: "Complaint page settings", section: "QR & NFC", keywords: "heading description complaint page text", href: "/dashboard/qr-nfc#complaint-settings" },
  { title: "AI review quick options", section: "QR & NFC", keywords: "ai chips tags quick picks review options", href: "/dashboard/qr-nfc#ai-options" },
  { title: "Today's attendance", section: "Attendance", keywords: "mark daily present absent leave today save", href: "/dashboard/attendance#today" },
  { title: "Past attendance records", section: "Attendance", keywords: "history records totals last 30 days summary", href: "/dashboard/attendance#records" },
  { title: "Attendance calendar", section: "Attendance", keywords: "calendar month view days grid", href: "/dashboard/attendance#calendar" },
  { title: "Business profile", section: "Settings", keywords: "branding logo cover color google review url profile name address", href: "/dashboard/profile" },
  { title: "Subscription", section: "Settings", keywords: "plan expiry renew billing", href: "/dashboard/subscription" },
];

export function DashboardSearch({ id }: { id: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return INDEX.filter((e) =>
      `${e.title} ${e.section} ${e.keywords}`.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [query]);

  useEffect(() => setActive(0), [query]);

  // Ctrl/⌘+K focuses the search from anywhere in the dashboard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
    router.push(href);
    // App Router doesn't reliably scroll to #anchors on data-loaded pages,
    // so scroll ourselves with retries until the section exists.
    const hash = href.includes("#") ? decodeURIComponent(href.split("#")[1]) : null;
    if (hash) {
      let tries = 0;
      const tick = () => {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
        if (++tries < 20) setTimeout(tick, 150);
      };
      setTimeout(tick, 100);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 transition-colors focus-within:border-primary/50">
        <Search className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          id={id}
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && results[active]) {
              go(results[active].href);
            } else if (e.key === "Escape") {
              setQuery("");
              inputRef.current?.blur();
            }
          }}
          placeholder="Search pages & sections…"
          autoComplete="off"
          className="h-10 w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
        />
        <kbd className="hidden shrink-0 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 lg:inline">
          Ctrl K
        </kbd>
      </div>

      {open && query.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          {results.length === 0 ? (
            <p className="px-4 py-5 text-center text-xs text-slate-400">
              No matches for “{query.trim()}”.
            </p>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1.5">
              {results.map((entry, i) => (
                <li key={entry.href}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      go(entry.href);
                    }}
                    onMouseEnter={() => setActive(i)}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors ${
                      i === active ? "bg-primary/10" : "hover:bg-slate-50"
                    }`}
                  >
                    <span>
                      <span className="block text-xs font-bold text-slate-900">{entry.title}</span>
                      <span className="block text-[11px] text-slate-400">{entry.section}</span>
                    </span>
                    {i === active && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-primary" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
