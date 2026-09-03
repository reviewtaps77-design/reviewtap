import { requireOwner, getSessionBusinessId } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Mail, Phone, Clock, AlertCircle, Sparkles } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Subscription & Account Status | ReviewTap",
};

export default async function SubscriptionPage() {
  const session = await requireOwner();
  const businessId = getSessionBusinessId(session);

  const business = await db.business.findUnique({
    where: { id: businessId },
    include: {
      subscriptions: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!business) return null;

  const currentSub = business.subscriptions[0];
  const isExpired = currentSub ? new Date(currentSub.expiryDate) < new Date() : false;
  const daysLeft = currentSub
    ? Math.max(0, Math.ceil((new Date(currentSub.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const planLabels: Record<string, string> = {
    monthly: "Monthly Plan (₹1,500/mo)",
    "6month": "6-Month Plan (₹7,000)",
    "12month": "12-Month Annual Plan (₹11,000 - Best Value)",
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Subscription & Plan Status</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          View your business account status, validity period, and license details.
        </p>
      </div>

      {/* Main Plan Card */}
      <Card className="rounded-3xl border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900">Current License</CardTitle>
            <CardDescription className="text-xs">
              Assigned subscription tier for {business.name}
            </CardDescription>
          </div>
          <Badge
            className={`text-xs px-3 py-1 font-bold border-0 ${
              !isExpired && currentSub?.status === "active"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {isExpired ? "EXPIRED" : currentSub?.status?.toUpperCase() || "ACTIVE"}
          </Badge>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Active Tier
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                {currentSub ? planLabels[currentSub.plan] || currentSub.plan : "Standard Plan"}
              </h3>
            </div>
            {!isExpired && daysLeft > 0 && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                {daysLeft} days remaining
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-1">
              <span className="text-slate-400 font-medium block">Subscription Start Date</span>
              <span className="text-sm font-bold text-slate-800">
                {currentSub ? new Date(currentSub.startDate).toLocaleDateString("en-IN", { dateStyle: "long" }) : "N/A"}
              </span>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-1">
              <span className="text-slate-400 font-medium block">Valid Until (Expiry Date)</span>
              <span className="text-sm font-bold text-slate-800">
                {currentSub ? new Date(currentSub.expiryDate).toLocaleDateString("en-IN", { dateStyle: "long" }) : "N/A"}
              </span>
            </div>
          </div>

          {/* Contact Admin for Renewal (SRS Point 40, FR-9) */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span>Need to Extend or Change Plan?</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              ReviewTap operates with dedicated manual subscription management. To extend your license or adjust your plan tier, please contact your account representative or our support desk directly:
            </p>
            <div className="flex flex-wrap gap-4 pt-1 text-xs font-semibold text-slate-800">
              <a href="mailto:reviewtaps77@gmail.com" className="flex items-center gap-1.5 text-primary hover:underline">
                <Mail className="w-4 h-4" /> reviewtaps77@gmail.com
              </a>
              <a href="tel:+919876543210" className="flex items-center gap-1.5 text-primary hover:underline">
                <Phone className="w-4 h-4" /> +91 98765 43210
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
