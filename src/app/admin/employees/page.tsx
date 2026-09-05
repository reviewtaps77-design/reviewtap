import { db } from "@/lib/db";
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
import { Users, ExternalLink, Star } from "lucide-react";

export const metadata = {
  title: "Global Staff Directory | Admin ReviewTap",
};

export default async function AdminEmployeesPage() {
  const employees = await db.employee.findMany({
    include: {
      business: true,
      _count: {
        select: { ratings: true, scans: true, reviews: true },
      },
      ratings: {
        select: { overall: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Global Staff Directory</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Inspect all staff members created across all business tenants.
        </p>
      </div>

      <Card className="rounded-3xl border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900">All Registered Staff ({employees.length})</CardTitle>
          <CardDescription className="text-xs">
            ReviewTap employee tracking: ratings and QR performance are strictly isolated by tenant.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/75">
              <TableRow>
                <TableHead className="font-bold text-slate-700">Staff Member</TableHead>
                <TableHead className="font-bold text-slate-700">Business Tenant</TableHead>
                <TableHead className="font-bold text-slate-700">Role / Dept</TableHead>
                <TableHead className="font-bold text-slate-700">Status</TableHead>
                <TableHead className="font-bold text-slate-700">Customer Ratings</TableHead>
                <TableHead className="text-right font-bold text-slate-700">Staff URL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-slate-400 text-xs">
                    No staff members registered across any business yet.
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp) => {
                  const total = emp._count.ratings;
                  const avgRating = total > 0
                    ? (emp.ratings.reduce((acc, curr) => acc + curr.overall, 0) / total).toFixed(1)
                    : null;

                  const empUrl = `${appBaseUrl}/biz/${emp.business.slug}/staff/${emp.slug}`;

                  return (
                    <TableRow key={emp.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                            {emp.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span>{emp.name}</span>
                            <span className="block text-[10px] text-slate-400 font-mono">
                              Code: {emp.employeeCode || "—"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-slate-700">
                        {emp.business.name}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {emp.role || "Staff"}
                        {emp.department && <span className="text-slate-400 block text-[10px]">{emp.department}</span>}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-[10px] uppercase font-bold border-0 ${
                            emp.status === "active"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {emp.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {avgRating ? (
                          <div className="flex items-center gap-1 text-xs font-bold text-slate-800">
                            <span>{avgRating} ★</span>
                            <span className="text-[10px] font-normal text-slate-400">({total})</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">No ratings ({total})</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <a
                          href={empUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                        >
                          /{emp.slug} <ExternalLink className="w-3 h-3" />
                        </a>
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
