import { requireOwner, getSessionBusinessId } from "@/lib/auth-guard";
import { signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  MessageSquare, 
  QrCode, 
  Building2, 
  CreditCard, 
  CalendarCheck,
  ExternalLink,
  ShieldCheck,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/employees", label: "Employees", icon: Users },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/feedback", label: "Private Feedback", icon: MessageSquare },
  { href: "/dashboard/qr-nfc", label: "QR & NFC Codes", icon: QrCode },
  { href: "/dashboard/attendance", label: "Staff Attendance", icon: CalendarCheck },
  { href: "/dashboard/profile", label: "Business Profile", icon: Building2 },
  { href: "/dashboard/subscription", label: "Subscription", icon: CreditCard },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireOwner();
  const businessId = getSessionBusinessId(session);

  const business = await db.business.findUnique({
    where: { id: businessId },
    include: {
      subscriptions: {
        where: { status: "active" },
        take: 1,
      },
    },
  });

  const businessName = business?.name || session.user?.name || "My Business";
  const brandColor = business?.brandColor || "#2563eb";
  const activeSub = business?.subscriptions?.[0];

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const publicPageUrl = business ? `${appBaseUrl}/biz/${business.slug}` : "#";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex shrink-0">
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          {business?.logoUrl ? (
            <img src={business.logoUrl} alt={`${businessName} logo`} className="w-10 h-10 rounded-xl object-cover shadow-sm" />
          ) : (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm"
              style={{ backgroundColor: brandColor }}
            >
              {businessName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-slate-900 truncate">{businessName}</h1>
            <p className="text-[11px] text-slate-400 font-medium">Owner Portal</p>
          </div>
        </div>

        {/* Public View link badge */}
        <div className="px-4 pt-3 pb-1">
          <a
            href={publicPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 transition-colors"
          >
            <span className="truncate">View Customer Page</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1.5" />
          </a>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <Icon className="w-4 h-4 text-slate-400" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        {/* Subscription Status Card */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-500 font-medium">Plan</span>
            <span className="font-bold text-emerald-600 capitalize">
              {activeSub ? activeSub.plan : "Active"}
            </span>
          </div>
          {activeSub && (
            <p className="text-[10px] text-slate-400">
              Valid until: {new Date(activeSub.expiryDate).toLocaleDateString("en-IN")}
            </p>
          )}
        </div>

        <div className="p-4 border-t border-slate-100">
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {business?.logoUrl ? (
              <img src={business.logoUrl} alt={`${businessName} logo`} className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                style={{ backgroundColor: brandColor }}
              >
                {businessName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <h1 className="text-sm font-bold truncate max-w-[180px]">{businessName}</h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={publicPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary font-semibold flex items-center gap-1"
            >
              View Page <ExternalLink className="w-3 h-3" />
            </a>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" /> Logout
              </button>
            </form>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
