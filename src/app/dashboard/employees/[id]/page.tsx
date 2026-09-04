import { requireOwner, getSessionBusinessId } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  QrCode, 
  Star, 
  Download, 
  ExternalLink, 
  Copy, 
  CheckCircle2, 
  XCircle,
  MessageSquare,
  Sparkles,
  TrendingUp,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { generateQRCodeDataUrl, buildEmployeeUrl } from "@/lib/qr";
import { toggleEmployeeStatus, deleteEmployee } from "@/actions/employee";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireOwner();
  const businessId = getSessionBusinessId(session);

  const employee = await db.employee.findFirst({
    where: { id, businessId },
    include: {
      business: true,
      ratings: {
        orderBy: { createdAt: "desc" },
        take: 30,
      },
      reviews: {
        where: { googleClick: true },
      },
      feedback: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: {
        select: { ratings: true, reviews: true, feedback: true, scans: true },
      },
    },
  });

  if (!employee) {
    notFound();
  }

  const totalRatings = employee._count.ratings;
  const totalScans = employee._count.scans;
  const googleClicks = employee._count.reviews;

  const avgOverall = totalRatings > 0
    ? (employee.ratings.reduce((acc, curr) => acc + curr.overall, 0) / totalRatings).toFixed(1)
    : "N/A";
  const avgBehaviour = totalRatings > 0
    ? (employee.ratings.reduce((acc, curr) => acc + curr.behaviour, 0) / totalRatings).toFixed(1)
    : "N/A";
  const avgFastness = totalRatings > 0
    ? (employee.ratings.reduce((acc, curr) => acc + curr.fastness, 0) / totalRatings).toFixed(1)
    : "N/A";

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const employeeUrl = `${appBaseUrl}/biz/${employee.business.slug}/staff/${employee.slug}`;

  const qrDataUrl = await generateQRCodeDataUrl(employeeUrl);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back button & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild className="rounded-xl h-10 w-10">
            <Link href="/dashboard/employees">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{employee.name}</h1>
              <Badge
                variant={employee.status === "active" ? "default" : "secondary"}
                className={
                  employee.status === "active"
                    ? "bg-emerald-100 text-emerald-800 border-0"
                    : "bg-slate-200 text-slate-600 border-0"
                }
              >
                {employee.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Code: <span className="font-mono">{employee.employeeCode || "N/A"}</span> • Role: {employee.role || "Staff"} • Dept: {employee.department || "General"}
            </p>
          </div>
        </div>

        {/* Status Actions */}
        <div className="flex items-center gap-2">
          <form
            action={async () => {
              "use server";
              await toggleEmployeeStatus(employee.id);
            }}
          >
            <SubmitButton
              variant={employee.status === "active" ? "outline" : "default"}
              size="sm"
              className="rounded-xl text-xs"
              pendingText="Updating…"
            >
              {employee.status === "active" ? "Deactivate Staff" : "Activate Staff"}
            </SubmitButton>
          </form>
          <form
            action={async () => {
              "use server";
              await deleteEmployee(employee.id);
            }}
          >
            <SubmitButton
              variant="ghost"
              size="sm"
              className="rounded-xl text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              pendingText="Deleting…"
            >
              Delete
            </SubmitButton>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Dedicated Employee QR & NFC Card */}
        <Card className="rounded-3xl border-slate-200/80 shadow-sm bg-white overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100 text-center">
            <CardTitle className="text-base font-bold text-slate-900">Staff QR & NFC</CardTitle>
            <CardDescription className="text-xs">
              Give this QR to {employee.name} or link to their NFC card
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-md">
              <img
                src={qrDataUrl}
                alt={`${employee.name} QR Code`}
                className="w-48 h-48 rounded-xl object-contain"
              />
              <p className="text-xs font-bold text-slate-800 mt-2">{employee.name}</p>
              <p className="text-[10px] text-slate-400 font-mono">/{employee.slug}</p>
            </div>

            <div className="w-full space-y-2 pt-2">
              <a
                href={qrDataUrl}
                download={`${employee.slug}-qr-code.png`}
                className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 shadow-sm transition-colors"
              >
                <Download className="w-4 h-4" /> Download HD QR (PNG)
              </a>

              <a
                href={employeeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                <ExternalLink className="w-4 h-4" /> Test Customer Page
              </a>
            </div>

            <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100 text-[11px] text-slate-600 text-left">
              <p className="font-semibold text-blue-900 mb-0.5">NFC Card Programming:</p>
              <p className="break-all font-mono text-[10px] text-slate-500">{employeeUrl}</p>
            </div>
          </CardContent>
        </Card>

        {/* Right: Detailed Performance & Ratings Log */}
        <div className="lg:col-span-2 space-y-6">
          {/* Performance Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm text-center">
              <span className="text-[11px] font-semibold text-slate-500 block">Total Ratings</span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block">{totalRatings}</span>
              <span className="text-[10px] text-slate-400">Based on verified scans</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm text-center">
              <span className="text-[11px] font-semibold text-slate-500 block">Behaviour</span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block">{avgBehaviour} ★</span>
              <span className="text-[10px] text-slate-400">Courtesy & attitude</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm text-center">
              <span className="text-[11px] font-semibold text-slate-500 block">Speed & Fastness</span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block">{avgFastness} ★</span>
              <span className="text-[10px] text-slate-400">Prompt delivery</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm text-center">
              <span className="text-[11px] font-semibold text-slate-500 block">Overall Score</span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block text-amber-500">{avgOverall} ★</span>
              <span className="text-[10px] text-slate-400">Overall customer rating</span>
            </div>
          </div>

          {/* Customer Reviews & Comments */}
          <Card className="rounded-3xl border-slate-200/80 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900">
                Customer Feedback Log ({totalRatings})
              </CardTitle>
              <CardDescription className="text-xs">
                Direct customer comments and ratings submitted for {employee.name}.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {employee.ratings.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No ratings submitted for this employee yet.
                </div>
              ) : (
                <div className="max-h-[34rem] space-y-3 overflow-y-auto pr-2">
                  {employee.ratings.map((rating) => (
                    <div
                      key={rating.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center text-amber-400 font-bold text-xs">
                            <span>★ {rating.overall}/5</span>
                          </div>
                          <span className="text-xs text-slate-500">
                            (Behaviour: {rating.behaviour} • Fastness: {rating.fastness})
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(rating.createdAt).toLocaleDateString("en-IN")}
                        </span>
                      </div>

                      {rating.comment && (
                        <p className="text-xs text-slate-700 italic bg-white p-2.5 rounded-xl border border-slate-100">
                          &ldquo;{rating.comment}&rdquo;
                        </p>
                      )}

                      <p className="text-[10px] text-slate-400 font-medium">
                        By {rating.customerName || "Customer (Anonymous)"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
