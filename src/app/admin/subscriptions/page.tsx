import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { extendSubscription, updateSubscriptionStatus } from "@/actions/admin";

export const metadata = {
  title: "Subscriptions Management | Admin ReviewTap",
};

export default async function SubscriptionsPage() {
  const subscriptions = await db.subscription.findMany({
    include: {
      business: true,
    },
    orderBy: { expiryDate: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tenant Subscriptions</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage offline subscription renewals, extend validities, and toggle tenant statuses.
        </p>
      </div>

      <Card className="rounded-3xl border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900">Active & Expired Subscriptions</CardTitle>
          <CardDescription className="text-xs">
            ReviewTap offline payment model: assign plans manually and extend validity when client pays offline.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/75">
              <TableRow>
                <TableHead className="font-bold text-slate-700">Business</TableHead>
                <TableHead className="font-bold text-slate-700">Plan</TableHead>
                <TableHead className="font-bold text-slate-700">Amount (INR)</TableHead>
                <TableHead className="font-bold text-slate-700">Start Date</TableHead>
                <TableHead className="font-bold text-slate-700">Expiry Date</TableHead>
                <TableHead className="font-bold text-slate-700">Status</TableHead>
                <TableHead className="text-right font-bold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center text-slate-400 text-xs">
                    No subscriptions found.
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((sub) => {
                  const isExpired = new Date(sub.expiryDate) < new Date();
                  
                  return (
                    <TableRow key={sub.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-bold text-slate-900">
                        {sub.business.name}
                      </TableCell>
                      <TableCell className="text-xs font-semibold uppercase text-slate-700">
                        {sub.plan}
                      </TableCell>
                      <TableCell className="text-xs font-mono font-bold text-slate-800">
                        ₹{sub.amount.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {new Date(sub.startDate).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-800">
                        {new Date(sub.expiryDate).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-[10px] uppercase font-bold border-0 ${
                            !isExpired && sub.status === "active"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {isExpired ? "EXPIRED" : sub.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <form
                            action={async () => {
                              "use server";
                              await extendSubscription(sub.id, 6);
                            }}
                          >
                            <Button variant="outline" size="sm" type="submit" className="text-xs h-8 px-2 font-medium">
                              +6 Months
                            </Button>
                          </form>
                          <form
                            action={async () => {
                              "use server";
                              await extendSubscription(sub.id, 12);
                            }}
                          >
                            <Button variant="outline" size="sm" type="submit" className="text-xs h-8 px-2 font-medium">
                              +1 Year
                            </Button>
                          </form>
                          <form
                            action={async () => {
                              "use server";
                              await updateSubscriptionStatus(sub.id, sub.status === "active" ? "suspended" : "active");
                            }}
                          >
                            <Button
                              variant={sub.status === "active" ? "ghost" : "default"}
                              size="sm"
                              type="submit"
                              className={`text-xs h-8 px-2 ${sub.status === "active" ? "text-red-600 hover:text-red-700" : ""}`}
                            >
                              {sub.status === "active" ? "Suspend" : "Activate"}
                            </Button>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
