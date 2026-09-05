import { requireOwner, getSessionBusinessId } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SubmitButton } from "@/components/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { COMPLAINT_STATUSES, complaintStatusLabel } from "@/lib/complaint";
import {
  addComplaintNote,
  deleteComplaintNote,
  updateComplaintStatus,
} from "@/actions/complaint";
import { updateFeedbackStatus, deleteFeedback } from "@/actions/feedback";
import { MessageSquare, MessageSquareWarning, Check, Trash2 } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Complaints and Private Feedback | ReviewTap" };

const COMPLAINT_STATUS_STYLES: Record<string, string> = {
  new: "bg-rose-100 text-rose-700",
  in_progress: "bg-amber-100 text-amber-700",
  resolved: "bg-emerald-100 text-emerald-700",
  closed: "bg-slate-200 text-slate-600",
};

export default async function ComplaintsAndFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusParam } = await searchParams;
  const session = await requireOwner();
  const businessId = getSessionBusinessId(session);

  const activeFilter = (COMPLAINT_STATUSES as readonly string[]).includes(statusParam || "")
    ? statusParam!
    : "all";

  const [business, complaints, statusCounts, totalComplaints, feedbacks] = await Promise.all([
    db.business.findUnique({ where: { id: businessId }, select: { name: true } }),
    db.complaint.findMany({
      where: { businessId, ...(activeFilter !== "all" ? { status: activeFilter } : {}) },
      include: {
        table: true,
        category: true,
        selections: { include: { category: true } },
        notes: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.complaint.groupBy({ by: ["status"], where: { businessId }, _count: true }),
    db.complaint.count({ where: { businessId } }),
    db.feedback.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      include: { employee: true },
    }),
  ]);

  const countByStatus = new Map(statusCounts.map((c) => [c.status, c._count]));
  const newComplaints = countByStatus.get("new") || 0;
  const unreadFeedback = feedbacks.filter((f) => f.status === "unread").length;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Complaints and Private Feedback</h1>
          {newComplaints > 0 && (
            <Badge className="rounded-full border-0 bg-rose-500 text-xs text-white hover:bg-rose-600">
              {newComplaints} New
            </Badge>
          )}
          {unreadFeedback > 0 && (
            <Badge className="rounded-full border-0 bg-rose-500 text-xs text-white hover:bg-rose-600">
              {unreadFeedback} Unread
            </Badge>
          )}
        </div>
        <p className="mt-0.5 text-sm text-slate-500">
          Private spot complaints and confidential customer feedback. Nothing here is published as reviews.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href="#complaints" className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100">
            Complaints ({totalComplaints})
          </a>
          <a href="#feedback" className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100">
            Private Feedback ({feedbacks.length})
          </a>
        </div>
      </div>

      {/* ============================================ Section: Complaints === */}
      <section id="complaints" className="scroll-mt-4 space-y-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <MessageSquareWarning className="h-5 w-5 text-primary" /> Complaints
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Private spot complaints submitted via Complaint QR codes.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/complaints-and-feedback"
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${activeFilter === "all" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"}`}
          >
            All ({totalComplaints})
          </Link>
          {COMPLAINT_STATUSES.map((status) => (
            <Link
              key={status}
              href={`/dashboard/complaints-and-feedback?status=${status}`}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${activeFilter === status ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"}`}
            >
              {complaintStatusLabel(status)} ({countByStatus.get(status) || 0})
            </Link>
          ))}
        </div>

        {complaints.length === 0 ? (
          <Card className="rounded-3xl border-slate-200/80 bg-white shadow-sm">
            <CardContent className="p-10 text-center">
              <MessageSquareWarning className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm font-semibold text-slate-700">No complaints found</p>
              <p className="mt-1 text-xs text-slate-400">
                {activeFilter === "all"
                  ? "When customers submit complaints via spot QR codes, they will appear here."
                  : `No complaints with status "${complaintStatusLabel(activeFilter)}".`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {complaints.map((complaint) => {
            const categoryLabels =
              complaint.selections.length > 0
                ? complaint.selections.map((s) => s.category.label)
                : [complaint.categoryLabel || complaint.category?.label || "Complaint"];
            return (
              <Card key={complaint.id} className="overflow-hidden rounded-3xl border-slate-200/80 bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {categoryLabels.map((label) => (
                          <span key={label} className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white">
                            {label}
                          </span>
                        ))}
                        <Badge className={`border-0 text-[10px] font-bold uppercase ${COMPLAINT_STATUS_STYLES[complaint.status] || "bg-slate-100 text-slate-600"}`}>
                          {complaintStatusLabel(complaint.status)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {complaint.tableName || complaint.table?.name || "No spot"}
                        {complaint.table?.branch ? ` • ${complaint.table.branch}` : ""} •{" "}
                        {new Date(complaint.createdAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                      {complaint.description && (
                        <p className="mt-2 text-sm italic text-slate-600">&ldquo;{complaint.description}&rdquo;</p>
                      )}
                    </div>
                  </div>

                  <details className="group mt-3">
                    <summary className="cursor-pointer list-none text-xs font-semibold text-primary">
                      <span className="group-open:hidden">View details & manage</span>
                      <span className="hidden group-open:inline">Hide details</span>
                    </summary>
                    <div className="mt-3 space-y-4 rounded-2xl bg-slate-50 p-4">
                      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
                        <div><dt className="font-semibold uppercase tracking-wider text-slate-400">Complaint ID</dt><dd className="mt-0.5 font-mono text-slate-700">{complaint.id}</dd></div>
                        <div><dt className="font-semibold uppercase tracking-wider text-slate-400">Business</dt><dd className="mt-0.5 text-slate-700">{business?.name}</dd></div>
                        <div><dt className="font-semibold uppercase tracking-wider text-slate-400">Branch</dt><dd className="mt-0.5 text-slate-700">{complaint.table?.branch || "—"}</dd></div>
                        <div><dt className="font-semibold uppercase tracking-wider text-slate-400">Spot</dt><dd className="mt-0.5 text-slate-700">{complaint.tableName || complaint.table?.name || "—"}</dd></div>
                        <div><dt className="font-semibold uppercase tracking-wider text-slate-400">Category</dt><dd className="mt-0.5 text-slate-700">{categoryLabels.join(", ")}</dd></div>
                        <div><dt className="font-semibold uppercase tracking-wider text-slate-400">Customer</dt><dd className="mt-0.5 text-slate-700">{complaint.customerName || "Anonymous"}</dd></div>
                        <div><dt className="font-semibold uppercase tracking-wider text-slate-400">Date / Time</dt><dd className="mt-0.5 text-slate-700">{new Date(complaint.createdAt).toLocaleString("en-IN")}</dd></div>
                      </dl>

                      <div>
                        <form
                          action={async (formData: FormData) => {
                            "use server";
                            await updateComplaintStatus(String(formData.get("complaintId")), String(formData.get("status")));
                          }}
                          className="flex items-end gap-2"
                        >
                          <input type="hidden" name="complaintId" value={complaint.id} />
                          <div className="flex-1 space-y-1">
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</label>
                            <select name="status" defaultValue={complaint.status} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700">
                              {COMPLAINT_STATUSES.map((s) => (
                                <option key={s} value={s}>{complaintStatusLabel(s)}</option>
                              ))}
                            </select>
                          </div>
                          <SubmitButton size="sm" className="rounded-xl" pendingText="Saving…">Update</SubmitButton>
                        </form>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Internal notes (private — never shown to customers)
                        </p>
                        {complaint.notes.length === 0 ? (
                          <p className="text-xs text-slate-400">No internal notes yet.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {complaint.notes.map((note) => (
                              <div key={note.id} className="flex items-start justify-between gap-2 rounded-xl bg-white p-2.5 text-xs">
                                <div>
                                  <p className="text-slate-700">{note.note}</p>
                                  <p className="mt-1 text-[10px] text-slate-400">
                                    {note.authorName || "Manager"} • {new Date(note.createdAt).toLocaleString("en-IN")}
                                  </p>
                                </div>
                                <form
                                  action={async () => {
                                    "use server";
                                    await deleteComplaintNote(note.id);
                                  }}
                                >
                                  <SubmitButton variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-400 hover:text-red-600" pendingText="">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </SubmitButton>
                                </form>
                              </div>
                            ))}
                          </div>
                        )}
                        <form
                          action={async (formData: FormData) => {
                            "use server";
                            await addComplaintNote(formData);
                          }}
                          className="flex flex-col gap-2 sm:flex-row"
                        >
                          <input type="hidden" name="complaintId" value={complaint.id} />
                          <Textarea name="note" rows={2} placeholder="e.g. Spoke with customer and replaced the food." className="flex-1 rounded-xl bg-white text-sm" required />
                          <SubmitButton size="sm" className="rounded-xl sm:self-end" pendingText="Adding…">Add Note</SubmitButton>
                        </form>
                      </div>
                    </div>
                  </details>
                </CardContent>
              </Card>
            );
          })}
          </div>
        )}
      </section>

      {/* ============================================ Section: Private Feedback === */}
      <section id="feedback" className="scroll-mt-4 space-y-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <MessageSquare className="h-5 w-5 text-primary" /> Private Feedback
            {unreadFeedback > 0 && (
              <Badge className="rounded-full bg-rose-500 text-xs text-white hover:bg-rose-600">
                {unreadFeedback} Unread
              </Badge>
            )}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Confidential customer opinions and constructive feedback sent directly to your management.
          </p>
        </div>

        <Card className="overflow-hidden rounded-3xl border-slate-200/80 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="text-base font-bold text-slate-900">Feedback Log</CardTitle>
            <CardDescription className="text-xs">
              Review, resolve, or manage customer suggestions.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/75">
                  <TableRow>
                    <TableHead className="font-bold text-slate-700">Date</TableHead>
                    <TableHead className="font-bold text-slate-700">Customer</TableHead>
                    <TableHead className="font-bold text-slate-700">Rating</TableHead>
                    <TableHead className="font-bold text-slate-700">Feedback Details</TableHead>
                    <TableHead className="font-bold text-slate-700">Staff Assigned</TableHead>
                    <TableHead className="font-bold text-slate-700">Status</TableHead>
                    <TableHead className="text-right font-bold text-slate-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedbacks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-slate-500">
                        <div className="mx-auto max-w-xs space-y-2">
                          <MessageSquare className="mx-auto h-8 w-8 text-slate-300" />
                          <p className="font-semibold text-slate-700">No private feedback yet</p>
                          <p className="text-xs text-slate-400">
                            When customers submit private suggestions, they will be listed here.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    feedbacks.map((fb) => (
                      <TableRow key={fb.id} className="hover:bg-slate-50/50">
                        <TableCell className="whitespace-nowrap text-xs text-slate-500">
                          {new Date(fb.createdAt).toLocaleDateString("en-IN")}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-semibold text-slate-900">
                            {fb.customerName || "Anonymous"}
                          </div>
                          {fb.customerEmail && (
                            <div className="font-mono text-[11px] text-slate-400">{fb.customerEmail}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="rounded-lg border border-amber-100 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-500">
                            {fb.rating} ★
                          </span>
                        </TableCell>
                        <TableCell className="max-w-sm space-y-1 py-3 text-xs text-slate-700">
                          {fb.liked && (
                            <div>
                              <span className="font-semibold text-emerald-700">Liked: </span>
                              <span>{fb.liked}</span>
                            </div>
                          )}
                          {fb.improve && (
                            <div>
                              <span className="font-semibold text-amber-700">Improve: </span>
                              <span>{fb.improve}</span>
                            </div>
                          )}
                          {fb.comments && (
                            <div className="italic text-slate-500">
                              &ldquo;{fb.comments}&rdquo;
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {fb.employee?.name ? (
                            <span className="font-medium text-slate-800">{fb.employee.name}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-[10px] uppercase font-bold border-0 ${
                              fb.status === "unread"
                                ? "bg-rose-100 text-rose-700"
                                : fb.status === "resolved"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {fb.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {fb.status === "unread" && (
                              <form
                                action={async () => {
                                  "use server";
                                  await updateFeedbackStatus(fb.id, "read");
                                }}
                              >
                                <SubmitButton variant="ghost" size="sm" className="h-7 px-2 text-xs" pendingText="Updating…">
                                  Mark Read
                                </SubmitButton>
                              </form>
                            )}
                            {fb.status !== "resolved" && (
                              <form
                                action={async () => {
                                  "use server";
                                  await updateFeedbackStatus(fb.id, "resolved");
                                }}
                              >
                                <SubmitButton variant="outline" size="sm" className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700" pendingText="Resolving…">
                                  <Check className="mr-1 h-3 w-3" /> Resolve
                                </SubmitButton>
                              </form>
                            )}
                            <form
                              action={async () => {
                                "use server";
                                await deleteFeedback(fb.id);
                              }}
                            >
                              <SubmitButton variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" pendingText="">
                                <Trash2 className="h-3.5 w-3.5" />
                              </SubmitButton>
                            </form>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-3xl border-slate-200/80 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Manage complaint setup</CardTitle>
          <CardDescription className="text-xs">
            Create spot QRs and customize complaint options from the QR & NFC section.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Link href="/dashboard/qr-nfc#complaint-qr" className="text-xs font-semibold text-primary hover:underline">
            Go to Spot Complaint QR codes →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
