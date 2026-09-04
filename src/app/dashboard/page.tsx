import { requireOwner, getSessionBusinessId } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { 
  QrCode, 
  MousePointerClick, 
  MessageSquare, 
  Star, 
  Sparkles, 
  Users, 
  TrendingUp,
  UserCheck,
  Clock,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

async function getDashboardStats(businessId: string) {
  const [
    totalScans,
    totalSessions,
    googleClicks,
    aiReviews,
    totalFeedback,
    unreadFeedback,
    totalRatings,
    avgRatings,
    activeEmployees,
    recentFeedback,
    recentRatings,
  ] = await Promise.all([
    db.scan.count({ where: { businessId } }),
    db.session.count({ where: { businessId } }),
    db.review.count({ where: { businessId, googleClick: true } }),
    db.review.count({ where: { businessId, aiGenerated: true } }),
    db.feedback.count({ where: { businessId } }),
    db.feedback.count({ where: { businessId, status: "unread" } }),
    db.employeeRating.count({ where: { businessId } }),
    db.employeeRating.aggregate({
      where: { businessId },
      _avg: { overall: true, behaviour: true, fastness: true },
    }),
    db.employee.count({ where: { businessId, status: "active" } }),
    db.feedback.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { employee: true },
    }),
    db.employeeRating.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { employee: true },
    }),
  ]);

  return {
    totalScans,
    totalSessions,
    googleClicks,
    aiReviews,
    totalFeedback,
    unreadFeedback,
    totalRatings,
    avgOverall: avgRatings._avg.overall || 0,
    avgBehaviour: avgRatings._avg.behaviour || 0,
    avgFastness: avgRatings._avg.fastness || 0,
    activeEmployees,
    recentFeedback,
    recentRatings,
  };
}

export default async function DashboardPage() {
  const session = await requireOwner();
  const businessId = getSessionBusinessId(session);
  const stats = await getDashboardStats(businessId);

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Overview</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time insights on your customer reviews, staff performance, and QR engagement.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline" className="rounded-xl font-medium">
            <Link href="/dashboard/qr-nfc">
              <QrCode className="w-4 h-4 mr-2" /> QR Codes
            </Link>
          </Button>
          <Button asChild size="sm" className="rounded-xl font-medium">
            <Link href="/dashboard/employees/add">
              <Users className="w-4 h-4 mr-2" /> Add Staff
            </Link>
          </Button>
        </div>
      </div>

      {/* 8 Metric Stat Cards (FR-13.1) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Scans"
          value={stats.totalScans}
          icon={<QrCode className="h-4 w-4 text-primary" />}
        />
        <StatCard
          title="Unique Sessions"
          value={stats.totalSessions}
          icon={<Users className="h-4 w-4 text-emerald-600" />}
        />
        <StatCard
          title="Google Clicks"
          value={stats.googleClicks}
          icon={<MousePointerClick className="h-4 w-4 text-blue-600" />}
        />
        <StatCard
          title="AI Generated Reviews"
          value={stats.aiReviews}
          icon={<Sparkles className="h-4 w-4 text-purple-600" />}
        />
        <StatCard
          title="Staff Interactions"
          value={stats.totalRatings}
          icon={<UserCheck className="h-4 w-4 text-indigo-600" />}
        />
        <StatCard
          title="Avg Staff Rating"
          value={stats.avgOverall > 0 ? `${stats.avgOverall.toFixed(1)} ★` : "N/A"}
          icon={<Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
        />
        <StatCard
          title="Private Feedback"
          value={stats.totalFeedback}
          icon={<MessageSquare className="h-4 w-4 text-rose-500" />}
        />
        <StatCard
          title="Active Staff"
          value={stats.activeEmployees}
          icon={<Users className="h-4 w-4 text-slate-700" />}
        />
      </div>

      {/* Staff Category Rating Breakdown */}
      {stats.totalRatings > 0 && (
        <Card className="rounded-3xl border-slate-200/80 shadow-sm overflow-hidden bg-white">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900">
              Staff Performance Scores ({stats.totalRatings} Ratings)
            </CardTitle>
            <CardDescription className="text-xs">
              Aggregate customer feedback across all 3 key performance dimensions.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
              <span className="text-xs font-semibold text-slate-500 block mb-1">Behaviour & Courtesy</span>
              <span className="text-2xl font-bold text-slate-900">{stats.avgBehaviour.toFixed(1)} / 5</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
              <span className="text-xs font-semibold text-slate-500 block mb-1">Speed & Promptness</span>
              <span className="text-2xl font-bold text-slate-900">{stats.avgFastness.toFixed(1)} / 5</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
              <span className="text-xs font-semibold text-slate-500 block mb-1">Overall Service</span>
              <span className="text-2xl font-bold text-slate-900">{stats.avgOverall.toFixed(1)} / 5</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity: Ratings & Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Staff Ratings */}
        <Card className="rounded-3xl border-slate-200/80 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">Recent Staff Ratings</CardTitle>
              <CardDescription className="text-xs">Latest customer reviews for your team</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <Link href="/dashboard/employees">View Staff <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            {stats.recentRatings.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No staff ratings yet. Display your employee QR codes to start receiving feedback.
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentRatings.map((r) => (
                  <div key={r.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{r.employee?.name || "Staff"}</span>
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full">
                          ★ {r.overall}/5
                        </span>
                      </div>
                      {r.comment && (
                        <p className="text-xs text-slate-600 mt-1 italic">&ldquo;{r.comment}&rdquo;</p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-1">
                        By {r.customerName || "Customer"} • {new Date(r.createdAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Private Feedback */}
        <Card className="rounded-3xl border-slate-200/80 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">Private Feedback</CardTitle>
              <CardDescription className="text-xs">Confidential customer suggestions</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <Link href="/dashboard/complaints-and-feedback#feedback">View All ({stats.unreadFeedback} unread) <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            {stats.recentFeedback.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No private feedback received yet.
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentFeedback.map((fb) => (
                  <div key={fb.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">
                        {fb.customerName || "Anonymous Customer"}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        fb.status === "unread" ? "bg-rose-100 text-rose-700" : "bg-slate-200 text-slate-700"
                      }`}>
                        {fb.status.toUpperCase()}
                      </span>
                    </div>
                    {fb.liked && (
                      <p className="text-xs text-emerald-700"><strong>Liked:</strong> {fb.liked}</p>
                    )}
                    {fb.improve && (
                      <p className="text-xs text-amber-700"><strong>Improve:</strong> {fb.improve}</p>
                    )}
                    {fb.comments && (
                      <p className="text-xs text-slate-600 italic">&ldquo;{fb.comments}&rdquo;</p>
                    )}
                    <p className="text-[10px] text-slate-400 pt-1">
                      Rating: {fb.rating}/5 • {new Date(fb.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
