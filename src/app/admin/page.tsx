import { db } from "@/lib/db";
import { StatCard } from "@/components/shared/stat-card";
import { Building2, Users, QrCode, MessageSquare, MousePointerClick, Sparkles, CreditCard, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Admin Dashboard | ReviewTap",
};

export default async function AdminDashboardPage() {
  const [
    totalBusinesses,
    activeBusinesses,
    suspendedBusinesses,
    totalEmployees,
    totalScans,
    totalGoogleClicks,
    totalAiUsage,
    totalFeedback,
  ] = await Promise.all([
    db.business.count(),
    db.business.count({ where: { status: "active" } }),
    db.business.count({ where: { status: "suspended" } }),
    db.employee.count(),
    db.scan.count(),
    db.review.count({ where: { googleClick: true } }),
    db.aiUsage.count(),
    db.feedback.count(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Platform Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Global metrics across all onboarded business tenants and customer review points.
          </p>
        </div>
        <Button asChild className="rounded-xl font-bold">
          <Link href="/admin/businesses/create">
            <Building2 className="w-4 h-4 mr-2" /> Add New Business
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Businesses"
          value={totalBusinesses}
          icon={<Building2 className="h-4 w-4 text-primary" />}
        />
        <StatCard
          title="Active Tenants"
          value={activeBusinesses}
          icon={<ShieldCheck className="h-4 w-4 text-emerald-600" />}
        />
        <StatCard
          title="Total Staff Registered"
          value={totalEmployees}
          icon={<Users className="h-4 w-4 text-indigo-600" />}
        />
        <StatCard
          title="Total Global Scans"
          value={totalScans}
          icon={<QrCode className="h-4 w-4 text-blue-600" />}
        />
        <StatCard
          title="Total Google Clicks"
          value={totalGoogleClicks}
          icon={<MousePointerClick className="h-4 w-4 text-blue-500" />}
        />
        <StatCard
          title="Total AI Reviews"
          value={totalAiUsage}
          icon={<Sparkles className="h-4 w-4 text-purple-600" />}
        />
        <StatCard
          title="Customer Feedback"
          value={totalFeedback}
          icon={<MessageSquare className="h-4 w-4 text-rose-500" />}
        />
        <StatCard
          title="Suspended / Expired"
          value={suspendedBusinesses}
          icon={<Building2 className="h-4 w-4 text-amber-500" />}
        />
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <Link
          href="/admin/businesses"
          className="p-5 rounded-3xl bg-white border border-slate-200/80 hover:border-primary/50 shadow-sm transition-all hover:shadow-md group space-y-2"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 group-hover:text-primary">
              Manage Businesses &rarr;
            </h3>
            <Building2 className="w-5 h-5 text-slate-400 group-hover:text-primary" />
          </div>
          <p className="text-xs text-slate-500">
            View, edit, activate, or suspend all registered customer business accounts.
          </p>
        </Link>

        <Link
          href="/admin/subscriptions"
          className="p-5 rounded-3xl bg-white border border-slate-200/80 hover:border-primary/50 shadow-sm transition-all hover:shadow-md group space-y-2"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 group-hover:text-primary">
              Manual Subscriptions &rarr;
            </h3>
            <CreditCard className="w-5 h-5 text-slate-400 group-hover:text-primary" />
          </div>
          <p className="text-xs text-slate-500">
            Assign Monthly, 6-Month, or 12-Month tiers and extend validities offline.
          </p>
        </Link>

        <Link
          href="/admin/employees"
          className="p-5 rounded-3xl bg-white border border-slate-200/80 hover:border-primary/50 shadow-sm transition-all hover:shadow-md group space-y-2"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 group-hover:text-primary">
              Global Employee Directory &rarr;
            </h3>
            <Users className="w-5 h-5 text-slate-400 group-hover:text-primary" />
          </div>
          <p className="text-xs text-slate-500">
            Inspect all staff members created across all businesses.
          </p>
        </Link>
      </div>
    </div>
  );
}
