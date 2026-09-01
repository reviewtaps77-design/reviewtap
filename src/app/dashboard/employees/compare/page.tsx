import { requireOwner, getSessionBusinessId } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, Users, AlertCircle, BarChart3 } from "lucide-react";
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

export const metadata = {
  title: "Staff Comparison | ReviewTap",
};

export default async function EmployeeComparePage() {
  const session = await requireOwner();
  const businessId = getSessionBusinessId(session);

  const employees = await db.employee.findMany({
    where: { businessId },
    include: {
      ratings: true,
      _count: {
        select: { ratings: true, reviews: true },
      },
    },
  });

  const staffStats = employees.map((emp) => {
    const total = emp._count.ratings;
    const avgOverall = total > 0
      ? emp.ratings.reduce((acc, curr) => acc + curr.overall, 0) / total
      : 0;
    const avgBehaviour = total > 0
      ? emp.ratings.reduce((acc, curr) => acc + curr.behaviour, 0) / total
      : 0;
    const avgFastness = total > 0
      ? emp.ratings.reduce((acc, curr) => acc + curr.fastness, 0) / total
      : 0;

    return {
      id: emp.id,
      name: emp.name,
      role: emp.role || "Staff",
      status: emp.status,
      total,
      avgOverall: avgOverall.toFixed(1),
      avgBehaviour: avgBehaviour.toFixed(1),
      avgFastness: avgFastness.toFixed(1),
      rawOverall: avgOverall,
    };
  }).sort((a, b) => b.rawOverall - a.rawOverall);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" asChild className="rounded-xl h-10 w-10">
          <Link href="/dashboard/employees">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Staff Performance Comparison</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Compare customer ratings across Behaviour, Speed, and Overall satisfaction.
          </p>
        </div>
      </div>

      {/* Fairness Warning Notice (Point 30) */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed">
          <p className="font-bold">Fair Evaluation Principle:</p>
          <p>
            Always account for sample size differences when assessing team performance. A staff member with 4.9★ based on 3 interactions should not be ranked above someone with 4.7★ based on 150 interactions.
          </p>
        </div>
      </div>

      {/* Comparison Table */}
      <Card className="rounded-3xl border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900">Performance Matrix</CardTitle>
          <CardDescription className="text-xs">
            Comprehensive breakdown of all active and inactive team members.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/75">
              <TableRow>
                <TableHead className="font-bold text-slate-700">Staff Member</TableHead>
                <TableHead className="font-bold text-slate-700">Role</TableHead>
                <TableHead className="font-bold text-slate-700">Sample Size</TableHead>
                <TableHead className="font-bold text-slate-700">Behaviour Rating</TableHead>
                <TableHead className="font-bold text-slate-700">Speed Rating</TableHead>
                <TableHead className="font-bold text-slate-700">Overall Rating</TableHead>
                <TableHead className="text-right font-bold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffStats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                    No staff members to compare. Add your team first.
                  </TableCell>
                </TableRow>
              ) : (
                staffStats.map((staff) => (
                  <TableRow key={staff.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-semibold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                          {staff.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span>{staff.name}</span>
                          <span className="block text-[10px] text-slate-400 font-normal">
                            Status: {staff.status}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">{staff.role}</TableCell>
                    <TableCell className="text-xs font-semibold text-slate-700">
                      {staff.total > 0 ? (
                        <span className="bg-slate-100 px-2 py-1 rounded-lg">
                          {staff.total} interactions
                        </span>
                      ) : (
                        <span className="text-slate-400">0 reviews</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-bold text-slate-800">
                      {staff.total > 0 ? `${staff.avgBehaviour} / 5` : "—"}
                    </TableCell>
                    <TableCell className="text-xs font-bold text-slate-800">
                      {staff.total > 0 ? `${staff.avgFastness} / 5` : "—"}
                    </TableCell>
                    <TableCell>
                      {staff.total > 0 ? (
                        <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 font-extrabold text-xs px-2.5 py-1 rounded-xl border border-amber-200">
                          <span>{staff.avgOverall}</span>
                          <span>★</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild className="rounded-xl text-xs h-8">
                        <Link href={`/dashboard/employees/${staff.id}`}>View Details</Link>
                      </Button>
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
