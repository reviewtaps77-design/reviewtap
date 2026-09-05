import { requireOwner, getSessionBusinessId } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";
import { Download, ExternalLink, QrCode, Info, User, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { generateQRCodeDataUrl } from "@/lib/qr";
import { buildComplaintUrl, ensureComplaintDefaults } from "@/lib/complaint";
import { ensureAiPromptDefaults } from "@/lib/ai-prompt";
import {
  createComplaintCategory,
  createComplaintQr,
  createComplaintTable,
  deleteComplaintCategory,
  deleteComplaintQr,
  deleteComplaintTable,
  moveComplaintCategory,
  toggleComplaintCategory,
  toggleComplaintQrStatus,
  toggleComplaintTableStatus,
  updateComplaintCategory,
  updateComplaintQr,
  updateComplaintSettings,
  updateComplaintTable,
} from "@/actions/complaint";
import {
  createAiPromptOption,
  deleteAiPromptOption,
  moveAiPromptOption,
  toggleAiPromptOption,
  updateAiPromptOption,
} from "@/actions/ai-prompt";
import Link from "next/link";

export const metadata = {
  title: "QR & NFC Management | ReviewTap",
};

export default async function QRNFCPage() {
  const session = await requireOwner();
  const businessId = getSessionBusinessId(session);

  await ensureComplaintDefaults(businessId);
  await ensureAiPromptDefaults(businessId);

  const business = await db.business.findUnique({
    where: { id: businessId },
    include: {
      employees: {
        where: { status: "active" },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!business) return null;

  const [complaintTables, complaintQrRows, complaintCategories, complaintSettings, aiPromptOptions] = await Promise.all([
    db.complaintTable.findMany({
      where: { businessId },
      include: { _count: { select: { qrs: true, complaints: true } } },
      orderBy: { name: "asc" },
    }),
    db.complaintQr.findMany({
      where: { businessId },
      include: {
        table: true,
        _count: { select: { complaints: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.complaintCategory.findMany({
      where: { businessId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    db.complaintSettings.findUnique({ where: { businessId } }),
    db.aiPromptOption.findMany({
      where: { businessId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const businessUrl = `${appBaseUrl}/biz/${business.slug}`;

  const businessQrDataUrl = await generateQRCodeDataUrl(businessUrl);

  const employeeQrList = await Promise.all(
    business.employees.map(async (emp) => {
      const empUrl = `${appBaseUrl}/biz/${business.slug}/staff/${emp.slug}`;
      const qrDataUrl = await generateQRCodeDataUrl(empUrl);
      return {
        ...emp,
        empUrl,
        qrDataUrl,
      };
    })
  );

  const complaintQrCards = await Promise.all(
    complaintQrRows.map(async (qr) => ({
      qr,
      url: buildComplaintUrl(qr.token),
      qrDataUrl: await generateQRCodeDataUrl(buildComplaintUrl(qr.token)),
    }))
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">QR & NFC Management</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Generate, download, and manage review codes for your store location, individual staff, and complaint spots.
        </p>
      </div>

      {/* NFC Explanation Note (SRS Point 36) */}
      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200/80 text-xs text-blue-900 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed">
          <p className="font-bold text-sm">How NFC Review Cards Work:</p>
          <p>
            Your NFC card simply opens your unique business or staff URL when tapped against any modern smartphone. No custom apps or hardware installation required!
          </p>
        </div>
      </div>

      {/* Main Business QR Card */}
      <Card className="rounded-3xl border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-lg font-bold text-slate-900">Primary Business QR Code</CardTitle>
          <CardDescription className="text-xs">
            Directly routes customers to {business.name}&apos;s review hub. Ideal for table stands, counter tents, and receipts.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <img
              src={businessQrDataUrl}
              alt="Business QR Code"
              className="w-48 h-48 rounded-xl object-contain bg-white p-2 border shadow-sm"
            />
            <p className="text-xs font-mono text-slate-400 mt-2 truncate max-w-[200px]">
              /biz/{business.slug}
            </p>
          </div>

          <div className="md:col-span-2 space-y-4">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-sm">Public Portal URL</h3>
              <p className="text-xs font-mono text-slate-600 bg-slate-100 p-2.5 rounded-xl break-all">
                {businessUrl}
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-2">
              <a
                href={businessQrDataUrl}
                download={`${business.slug}-business-qr.png`}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 shadow-sm transition-colors"
              >
                <Download className="w-4 h-4" /> Download HD QR (PNG)
              </a>
              <a
                href={`/biz/${business.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Opens on this host — works for local testing too"
                className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
              >
                <ExternalLink className="w-4 h-4" /> Preview Live
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee QR Codes Grid (FR-14.4) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Staff-Dedicated QR & NFC Codes</h3>
            <p className="text-xs text-slate-500">
              Each staff member has a dedicated URL to track customer ratings directly.
            </p>
          </div>
          <Button asChild size="sm" variant="outline" className="rounded-xl text-xs">
            <Link href="/dashboard/employees/add">Add Staff Member</Link>
          </Button>
        </div>

        {employeeQrList.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200/80 p-6 text-slate-500 text-xs space-y-2">
            <User className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-700">No staff members added yet</p>
            <p className="text-slate-400">Add employees to auto-generate personalized QR codes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {employeeQrList.map((emp) => (
              <Card key={emp.id} className="rounded-3xl border-slate-200/80 shadow-sm bg-white overflow-hidden p-4 flex flex-col justify-between space-y-4">
                <div className="flex items-start gap-3">
                  <img
                    src={emp.qrDataUrl}
                    alt={`${emp.name} QR`}
                    className="w-24 h-24 rounded-xl object-contain bg-white p-1.5 border shadow-inner shrink-0"
                  />
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-sm text-slate-900 truncate">{emp.name}</h4>
                    <p className="text-xs text-slate-500">{emp.role || "Staff"}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">Code: {emp.employeeCode || "—"}</p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <a
                    href={emp.qrDataUrl}
                    download={`${emp.slug}-qr-code.png`}
                    className="w-full inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download QR
                  </a>
                  <a
                    href={`/biz/${business.slug}/staff/${emp.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Opens on this host — works for local testing too"
                    className="w-full inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Test Staff URL
                  </a>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ============================================ Complaint QR (per-spot) === */}
      <div id="complaint-qr" className="scroll-mt-4 space-y-4 border-t border-slate-200 pt-8">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <QrCode className="h-5 w-5 text-primary" /> Spot Complaint QR Codes
          </h3>
          <p className="text-xs text-slate-500">
            One unique QR per spot. Printed QRs stay valid even if you change options or branding later.
          </p>
        </div>

        {/* Spots */}
        <Card className="overflow-hidden rounded-3xl border-slate-200/80 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-base">Spots</CardTitle>
          <CardDescription className="text-xs">Spots work for every business — tables, rooms, counters or beds. Branch is optional.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <form action={async (formData: FormData) => { "use server"; await createComplaintTable(formData); }} className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Spot name *</Label>
                <Input name="name" placeholder="Table 12, Room 101, Counter 2…" required className="rounded-xl bg-white" />
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Branch (optional)</Label>
                <Input name="branch" placeholder="Pune" className="rounded-xl bg-white" />
              </div>
              <SubmitButton className="rounded-xl sm:w-auto" pendingText="Adding…">
                <Plus className="h-4 w-4" /> Add Spot
              </SubmitButton>
            </form>

            {complaintTables.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">No spots yet. Add your first spot above.</p>
            ) : (
              <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto pr-1">
                {complaintTables.map((table) => (
                  <div key={table.id} className="py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {table.name}
                          {table.branch && <span className="ml-2 text-xs font-normal text-slate-400">{table.branch}</span>}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {table._count.qrs} QR(s) • {table._count.complaints} complaint(s)
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge className={`border-0 text-[10px] font-bold uppercase ${table.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                          {table.status}
                        </Badge>
                        <form action={async () => { "use server"; await toggleComplaintTableStatus(table.id); }}>
                          <SubmitButton variant="outline" size="sm" className="h-7 rounded-lg px-2 text-[11px]" pendingText="…">
                            {table.status === "active" ? "Deactivate" : "Activate"}
                          </SubmitButton>
                        </form>
                        <form action={async () => { "use server"; await deleteComplaintTable(table.id); }}>
                          <SubmitButton variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" pendingText="">
                            <Trash2 className="h-3.5 w-3.5" />
                          </SubmitButton>
                        </form>
                      </div>
                    </div>
                    <details className="group mt-1.5">
                      <summary className="cursor-pointer list-none text-xs font-semibold text-primary">
                        <span className="group-open:hidden">Edit</span>
                        <span className="hidden group-open:inline">Close</span>
                      </summary>
                      <form
                        action={async (formData: FormData) => { "use server"; await updateComplaintTable(table.id, formData); }}
                        className="mt-2 flex flex-col gap-2 rounded-2xl bg-slate-50 p-3 sm:flex-row sm:items-end"
                      >
                        <div className="flex-1 space-y-1">
                          <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Spot name</Label>
                          <Input name="name" defaultValue={table.name} required className="rounded-xl bg-white" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Branch</Label>
                          <Input name="branch" defaultValue={table.branch || ""} className="rounded-xl bg-white" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</Label>
                          <select name="status" defaultValue={table.status} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                        <SubmitButton size="sm" className="rounded-xl" pendingText="Saving…">Save</SubmitButton>
                      </form>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Complaint QR codes */}
        <Card className="overflow-hidden rounded-3xl border-slate-200/80 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-base">Complaint QR codes</CardTitle>
            <CardDescription className="text-xs">Assign one QR per spot, print it, and place it at the spot.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <form action={async (formData: FormData) => { "use server"; await createComplaintQr(formData); }} className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Spot *</Label>
                <select name="tableId" required defaultValue="" className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700">
                  <option value="" disabled>Select a spot</option>
                  {complaintTables.filter((t) => t.status === "active").map((t) => (
                    <option key={t.id} value={t.id}>{t.branch ? `${t.branch} • ${t.name}` : t.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Label (optional)</Label>
                <Input name="label" placeholder="e.g. Window-side print" className="rounded-xl bg-white" />
              </div>
              <SubmitButton className="rounded-xl sm:w-auto" pendingText="Creating…">
                <Plus className="h-4 w-4" /> Create QR
              </SubmitButton>
            </form>

            {complaintQrCards.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">No Complaint QRs yet. Create one for a spot above.</p>
            ) : (
              <div className="grid max-h-[36rem] grid-cols-1 gap-4 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
                {complaintQrCards.map(({ qr, url, qrDataUrl }) => (
                  <div key={qr.id} className="flex flex-col space-y-3 rounded-2xl border border-slate-200/80 p-4">
                    <div className="flex items-start gap-3">
                      <img src={qrDataUrl} alt={`Complaint QR for ${qr.table?.name || "spot"}`} className="h-24 w-24 shrink-0 rounded-xl border bg-white p-1.5 shadow-inner" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {qr.table ? (qr.table.branch ? `${qr.table.branch} • ${qr.table.name}` : qr.table.name) : "Unassigned"}
                        </p>
                        {qr.label && <p className="truncate text-xs text-slate-500">{qr.label}</p>}
                        <p className="mt-1 font-mono text-[10px] text-slate-400">ID: {qr.token.slice(0, 8)}…</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <Badge className={`border-0 text-[10px] font-bold uppercase ${qr.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                            {qr.status}
                          </Badge>
                          <span className="text-[11px] text-slate-400">{qr._count.complaints} complaint(s)</span>
                        </div>
                      </div>
                    </div>
                    <p className="truncate rounded-xl bg-slate-100 p-2 font-mono text-[11px] text-slate-600">{url}</p>
                    <div className="flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
                      <a href={qrDataUrl} download={`complaint-qr-${qr.table?.name?.replace(/\s+/g, "-").toLowerCase() || qr.token.slice(0, 8)}.png`} className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-slate-900 px-3 text-[11px] font-semibold text-white hover:bg-slate-800">
                        <Download className="h-3.5 w-3.5" /> Download
                      </a>
                      <a href={`/complaint/${qr.token}`} target="_blank" rel="noopener noreferrer" title="Opens on this host — works for local testing too" className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-[11px] font-semibold text-slate-700 hover:bg-slate-200">
                        <ExternalLink className="h-3.5 w-3.5" /> View
                      </a>
                      <form action={async () => { "use server"; await toggleComplaintQrStatus(qr.id); }}>
                        <SubmitButton variant="outline" size="sm" className="h-8 rounded-xl px-3 text-[11px]" pendingText="…">
                          {qr.status === "active" ? "Disable" : "Enable"}
                        </SubmitButton>
                      </form>
                      <form action={async () => { "use server"; await deleteComplaintQr(qr.id); }}>
                        <SubmitButton variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600" pendingText="">
                          <Trash2 className="h-3.5 w-3.5" />
                        </SubmitButton>
                      </form>
                    </div>
                    <details className="group">
                      <summary className="cursor-pointer list-none text-xs font-semibold text-primary">
                        <span className="group-open:hidden">Edit QR</span>
                        <span className="hidden group-open:inline">Close</span>
                      </summary>
                      <form
                        action={async (formData: FormData) => { "use server"; await updateComplaintQr(qr.id, formData); }}
                        className="mt-2 space-y-2 rounded-2xl bg-slate-50 p-3"
                      >
                        <div className="space-y-1">
                          <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Spot</Label>
                          <select name="tableId" defaultValue={qr.tableId || ""} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700">
                            <option value="">Unassigned</option>
                            {complaintTables.map((t) => (
                              <option key={t.id} value={t.id}>{t.branch ? `${t.branch} • ${t.name}` : t.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Label</Label>
                          <Input name="label" defaultValue={qr.label || ""} className="rounded-xl bg-white" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</Label>
                          <select name="status" defaultValue={qr.status} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700">
                            <option value="active">Active</option>
                            <option value="disabled">Disabled</option>
                          </select>
                        </div>
                        <p className="text-[11px] text-slate-400">The QR link never changes, so reprinting is not needed.</p>
                        <SubmitButton size="sm" className="w-full rounded-xl" pendingText="Saving…">Save QR</SubmitButton>
                      </form>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Complaint options */}
        <Card className="overflow-hidden rounded-3xl border-slate-200/80 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-base">Complaint options</CardTitle>
            <CardDescription className="text-xs">What customers see under &ldquo;What went wrong?&rdquo;. Changes apply instantly — no reprint needed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <form action={async (formData: FormData) => { "use server"; await createComplaintCategory(formData); }} className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">New option *</Label>
                <Input name="label" placeholder="e.g. Waiting Time" required className="rounded-xl bg-white" />
              </div>
              <SubmitButton className="rounded-xl sm:w-auto" pendingText="Adding…">
                <Plus className="h-4 w-4" /> Add Option
              </SubmitButton>
            </form>

            <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto pr-1">
              {complaintCategories.map((category, index) => (
                <div key={category.id} className="py-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <form action={async () => { "use server"; await moveComplaintCategory(category.id, "up"); }}>
                        <SubmitButton variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={index === 0} pendingText="">
                          <ChevronUp className="h-4 w-4" />
                        </SubmitButton>
                      </form>
                      <form action={async () => { "use server"; await moveComplaintCategory(category.id, "down"); }}>
                        <SubmitButton variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={index === complaintCategories.length - 1} pendingText="">
                          <ChevronDown className="h-4 w-4" />
                        </SubmitButton>
                      </form>
                      <p className={`text-sm font-semibold ${category.isActive ? "text-slate-900" : "text-slate-400 line-through"}`}>
                        {category.label}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge className={`border-0 text-[10px] font-bold uppercase ${category.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                        {category.isActive ? "Enabled" : "Disabled"}
                      </Badge>
                      <form action={async () => { "use server"; await toggleComplaintCategory(category.id); }}>
                        <SubmitButton variant="outline" size="sm" className="h-7 rounded-lg px-2 text-[11px]" pendingText="…">
                          {category.isActive ? "Disable" : "Enable"}
                        </SubmitButton>
                      </form>
                      <form action={async () => { "use server"; await deleteComplaintCategory(category.id); }}>
                        <SubmitButton variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" pendingText="">
                          <Trash2 className="h-3.5 w-3.5" />
                        </SubmitButton>
                      </form>
                    </div>
                  </div>
                  <details className="group ml-9 mt-1">
                    <summary className="cursor-pointer list-none text-xs font-semibold text-primary">
                      <span className="group-open:hidden">Rename</span>
                      <span className="hidden group-open:inline">Close</span>
                    </summary>
                    <form
                      action={async (formData: FormData) => { "use server"; await updateComplaintCategory(category.id, formData); }}
                      className="mt-2 flex gap-2"
                    >
                      <Input name="label" defaultValue={category.label} required className="h-9 rounded-xl text-sm" />
                      <SubmitButton size="sm" className="h-9 rounded-xl" pendingText="Saving…">Save</SubmitButton>
                    </form>
                  </details>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Complaint page settings */}
        <Card className="overflow-hidden rounded-3xl border-slate-200/80 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-base">Complaint page settings</CardTitle>
            <CardDescription className="text-xs">Heading and description shown on the customer complaint page for {business.name}.</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <form action={async (formData: FormData) => { "use server"; await updateComplaintSettings(formData); }} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Page heading</Label>
                <Input name="heading" defaultValue={complaintSettings?.heading || "What went wrong?"} maxLength={200} className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Page description</Label>
                <Textarea name="description" defaultValue={complaintSettings?.description || ""} rows={2} maxLength={600} className="rounded-xl text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Written complaint box</Label>
                <select name="allowDescription" defaultValue={complaintSettings?.allowDescription === false ? "false" : "true"} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 sm:w-64">
                  <option value="true">Show &ldquo;Type your complaint (optional)&rdquo;</option>
                  <option value="false">Hide description box (options only)</option>
                </select>
              </div>
              <SubmitButton className="w-full rounded-xl sm:w-auto" pendingText="Saving…">Save Settings</SubmitButton>
            </form>
          </CardContent>
        </Card>

        {/* AI Review quick options */}
        <Card id="ai-options" className="overflow-hidden rounded-3xl border-slate-200/80 bg-white shadow-sm scroll-mt-4">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-base">AI Review quick options</CardTitle>
            <CardDescription className="text-xs">The tappable “What did you like most?” chips on your AI Review Assistant page. Changes apply instantly.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <form action={async (formData: FormData) => { "use server"; await createAiPromptOption(formData); }} className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">New option *</Label>
                <Input name="label" placeholder="e.g. Live music nights" required className="rounded-xl bg-white" />
              </div>
              <SubmitButton className="rounded-xl sm:w-auto" pendingText="Adding…">
                <Plus className="h-4 w-4" /> Add Option
              </SubmitButton>
            </form>

            {aiPromptOptions.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">No quick options yet. Add your first one above.</p>
            ) : (
              <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto pr-1">
                {aiPromptOptions.map((option, index) => (
                  <div key={option.id} className="py-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <form action={async () => { "use server"; await moveAiPromptOption(option.id, "up"); }}>
                          <SubmitButton variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={index === 0} pendingText="">
                            <ChevronUp className="h-4 w-4" />
                          </SubmitButton>
                        </form>
                        <form action={async () => { "use server"; await moveAiPromptOption(option.id, "down"); }}>
                          <SubmitButton variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={index === aiPromptOptions.length - 1} pendingText="">
                            <ChevronDown className="h-4 w-4" />
                          </SubmitButton>
                        </form>
                        <p className={`text-sm font-semibold ${option.isActive ? "text-slate-900" : "text-slate-400 line-through"}`}>
                          {option.label}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge className={`border-0 text-[10px] font-bold uppercase ${option.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                          {option.isActive ? "Shown" : "Hidden"}
                        </Badge>
                        <form action={async () => { "use server"; await toggleAiPromptOption(option.id); }}>
                          <SubmitButton variant="outline" size="sm" className="h-7 rounded-lg px-2 text-[11px]" pendingText="…">
                            {option.isActive ? "Hide" : "Show"}
                          </SubmitButton>
                        </form>
                        <form action={async () => { "use server"; await deleteAiPromptOption(option.id); }}>
                          <SubmitButton variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" pendingText="">
                            <Trash2 className="h-3.5 w-3.5" />
                          </SubmitButton>
                        </form>
                      </div>
                    </div>
                    <details className="group ml-9 mt-1">
                      <summary className="cursor-pointer list-none text-xs font-semibold text-primary">
                        <span className="group-open:hidden">Rename</span>
                        <span className="hidden group-open:inline">Close</span>
                      </summary>
                      <form
                        action={async (formData: FormData) => { "use server"; await updateAiPromptOption(option.id, formData); }}
                        className="mt-2 flex gap-2"
                      >
                        <Input name="label" defaultValue={option.label} required className="h-9 rounded-xl text-sm" />
                        <SubmitButton size="sm" className="h-9 rounded-xl" pendingText="Saving…">Save</SubmitButton>
                      </form>
                    </details>
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
