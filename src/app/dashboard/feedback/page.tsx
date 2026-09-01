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
import { Button } from "@/components/ui/button";
import { MessageSquare, Check, Eye, Trash2, Mail, User } from "lucide-react";
import { updateFeedbackStatus, deleteFeedback } from "@/actions/feedback";

export const metadata = {
  title: "Private Feedback | ReviewTap",
};

export default async function FeedbackPage() {
  const session = await requireOwner();
  const businessId = getSessionBusinessId(session);

  const feedbacks = await db.feedback.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    include: { employee: true },
  });

  const unreadCount = feedbacks.filter((f) => f.status === "unread").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Private Feedback</h1>
            {unreadCount > 0 && (
              <Badge className="bg-rose-500 hover:bg-rose-600 text-white rounded-full text-xs">
                {unreadCount} Unread
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Confidential customer opinions and constructive feedback sent directly to your management.
          </p>
        </div>
      </div>

      <Card className="rounded-3xl border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900">Feedback Log</CardTitle>
          <CardDescription className="text-xs">
            Review, resolve, or manage customer suggestions.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
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
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                    <div className="max-w-xs mx-auto space-y-2">
                      <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
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
                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(fb.createdAt).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-xs text-slate-900">
                        {fb.customerName || "Anonymous"}
                      </div>
                      {fb.customerEmail && (
                        <div className="text-[11px] text-slate-400 font-mono">{fb.customerEmail}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-xs text-amber-500 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                        {fb.rating} ★
                      </span>
                    </TableCell>
                    <TableCell className="max-w-sm text-xs text-slate-700 space-y-1 py-3">
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
                        <div className="text-slate-500 italic">
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
                            <Button variant="ghost" size="sm" type="submit" className="h-7 text-xs px-2">
                              Mark Read
                            </Button>
                          </form>
                        )}
                        {fb.status !== "resolved" && (
                          <form
                            action={async () => {
                              "use server";
                              await updateFeedbackStatus(fb.id, "resolved");
                            }}
                          >
                            <Button variant="outline" size="sm" type="submit" className="h-7 text-xs px-2 text-emerald-600 hover:text-emerald-700">
                              <Check className="w-3 h-3 mr-1" /> Resolve
                            </Button>
                          </form>
                        )}
                        <form
                          action={async () => {
                            "use server";
                            await deleteFeedback(fb.id);
                          }}
                        >
                          <Button variant="ghost" size="sm" type="submit" className="h-7 w-7 p-0 text-red-500 hover:text-red-600">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
