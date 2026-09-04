"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  MessageSquareWarning,
  QrCode,
  Building2,
  CreditCard,
  CalendarCheck,
  ExternalLink,
  EllipsisVertical,
  X,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/employees", label: "Employees", icon: Users },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/complaints-and-feedback", label: "Complaints & Feedback", icon: MessageSquareWarning },
  { href: "/dashboard/qr-nfc", label: "QR & NFC Codes", icon: QrCode },
  { href: "/dashboard/attendance", label: "Staff Attendance", icon: CalendarCheck },
  { href: "/dashboard/profile", label: "Business Profile", icon: Building2 },
  { href: "/dashboard/subscription", label: "Subscription", icon: CreditCard },
];

interface DashboardMobileNavProps {
  businessName: string;
  brandColor: string;
  logoUrl?: string | null;
  publicPageUrl: string;
  planLabel: string;
  planExpiry?: string | null;
}

export function DashboardMobileNav({
  businessName,
  brandColor,
  logoUrl,
  publicPageUrl,
  planLabel,
  planExpiry,
}: DashboardMobileNavProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open ]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 transition-colors hover:bg-slate-100"
      >
        <EllipsisVertical className="h-5 w-5" />
      </button>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Slide-in panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl transition-transform duration-200 md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center gap-3 border-b border-slate-100 p-4">
          {logoUrl ? (
            <img src={logoUrl} alt={`${businessName} logo`} className="h-10 w-10 rounded-xl object-cover shadow-sm" />
          ) : (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm"
              style={{ backgroundColor: brandColor }}
            >
              {businessName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-bold text-slate-900">{businessName}</h1>
            <p className="text-[11px] font-medium text-slate-400">Owner Portal</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 pb-1 pt-3">
          <a
            href={publicPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between rounded-xl bg-slate-100/80 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200/80"
          >
            <span className="truncate">View Customer Page</span>
            <ExternalLink className="ml-1.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
          </a>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <Icon className="h-4 w-4 text-slate-400" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 bg-slate-50/50 p-4">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-500">Plan</span>
            <span className="font-bold capitalize text-emerald-600">{planLabel}</span>
          </div>
          {planExpiry && <p className="text-[10px] text-slate-400">Valid until: {planExpiry}</p>}
        </div>
      </aside>
    </>
  );
}
