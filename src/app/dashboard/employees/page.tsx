import { requireOwner, getSessionBusinessId } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import Link from "next/link";
import { Plus, Users, User, Eye, QrCode, TrendingUp, BarChart2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Staff Management | ReviewTap",
};

export default async function EmployeesPage() {
  const session = await requireOwner();
  const businessId = getSessionBusinessId(session);

  const employees = await db.employee.findMany({
    where: { businessId },
    include: {
      _count: {
        select: { ratings: true, feedback: true },
      },
      ratings: {
        select: { overall: true, behaviour: true, fastness: true },
      },
      qrCodes: {
        where: { type: "employee_qr" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Staff & Employee Directory</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your employees, track individual customer ratings, and download branded QR cards.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/dashboard/employees/compare">
              <BarChart2 className="w-4 h-4 mr-2" />
              Staff Comparison
            </Link>
          </Button>
          <Button asChild className="rounded-xl">
            <Link href="/dashboard/employees/add">
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Link>
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/75">
            <TableRow>
              <TableHead className="font-bold text-slate-700">Staff Member</TableHead>
              <TableHead className="font-bold text-slate-700">Employee Code</TableHead>
              <TableHead className="font-bold text-slate-700">Role / Dept</TableHead>
              <TableHead className="font-bold text-slate-700">Status</TableHead>
              <TableHead className="font-bold text-slate-700">Interactions</TableHead>
              <TableHead className="font-bold text-slate-700">Avg Rating</TableHead>
              <TableHead className="text-right font-bold text-slate-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                  <div className="max-w-xs mx-auto space-y-3">
                    <Users className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-700">No employees added yet</p>
                    <p className="text-xs text-slate-400">
                      Add your servers, staff, or team members to generate dedicated review QR codes.
                    </p>
                    <Button asChild size="sm" className="rounded-xl">
                      <Link href="/dashboard/employees/add">Add First Employee</Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              employees.map((emp) => {
                const totalRatings = emp._count.ratings;
                const avgRating =
                  totalRatings > 0
                    ? (emp.ratings.reduce((acc, curr) => acc + curr.overall, 0) / totalRatings).toFixed(1)
                    : null;

                return (
                  <TableRow key={emp.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-100">
                          {emp.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span>{emp.name}</span>
                          <span className="block text-[11px] text-slate-400 font-normal">
                            /{emp.slug}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 text-xs font-mono">
                      {emp.employeeCode || "—"}
                    </TableCell>
                    <TableCell className="text-slate-600 text-xs">
                      {emp.role || "Staff"}
                      {emp.department && (
                        <span className="text-slate-400 block text-[10px]">{emp.department}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={emp.status === "active" ? "default" : "secondary"}
                        className={
                          emp.status === "active"
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0"
                            : "bg-slate-200 text-slate-600 hover:bg-slate-200 border-0"
                        }
                      >
                        {emp.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-800 text-xs">
                      {totalRatings} {totalRatings === 1 ? "review" : "reviews"}
                    </TableCell>
                    <TableCell>
                      {avgRating ? (
                        <div className="flex items-center gap-1 font-bold text-xs text-slate-900">
                          <span>{avgRating}</span>
                          <span className="text-amber-400">★</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">No ratings</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button variant="outline" size="sm" asChild className="rounded-xl text-xs h-8">
                          <Link href={`/dashboard/employees/${emp.id}`}>
                            <Eye className="w-3.5 h-3.5 mr-1" /> Profile & QR
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
