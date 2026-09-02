import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guard";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Building2, 
  CreditCard, 
  Users, 
  LogOut, 
  ShieldAlert,
  ExternalLink
} from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex shrink-0">
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center font-bold text-sm">
            RT
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">ReviewTap</h1>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Super Admin</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1.5">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold text-slate-300 rounded-xl hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LayoutDashboard className="h-4 w-4 text-slate-400" />
            Overview
          </Link>
          <Link
            href="/admin/businesses"
            className="flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold text-slate-300 rounded-xl hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Building2 className="h-4 w-4 text-slate-400" />
            Businesses & Tenants
          </Link>
          <Link
            href="/admin/subscriptions"
            className="flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold text-slate-300 rounded-xl hover:bg-slate-800 hover:text-white transition-colors"
          >
            <CreditCard className="h-4 w-4 text-slate-400" />
            Subscriptions
          </Link>
          <Link
            href="/admin/employees"
            className="flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold text-slate-300 rounded-xl hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Users className="h-4 w-4 text-slate-400" />
            Global Staff Directory
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link
            href="/login"
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors p-2"
          >
            <LogOut className="h-4 w-4" />
            Switch / Exit Admin
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Platform Administration</h2>
            <span className="text-[11px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-100">
              Hostinger Multi-Tenant
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="text-xs font-semibold text-slate-600 hover:text-primary flex items-center gap-1"
            >
              Public Website <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
