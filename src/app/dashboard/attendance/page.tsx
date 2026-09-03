import { requireOwner, getSessionBusinessId } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { saveAttendance } from "@/actions/attendance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarCheck } from "lucide-react";

export const metadata = { title: "Staff Attendance | ReviewTap" };

export default async function AttendancePage() {
  const session = await requireOwner();
  const businessId = getSessionBusinessId(session);
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);

  const [employees, attendance, pastAttendance] = await Promise.all([
    db.employee.findMany({ where: { businessId }, orderBy: { name: "asc" } }),
    db.attendance.findMany({ where: { businessId, date }, select: { employeeId: true, status: true } }),
    db.attendance.findMany({
      where: { businessId },
      include: { employee: { select: { name: true } } },
      orderBy: [{ date: "desc" }, { employee: { name: "asc" } }],
      take: 200,
    }),
  ]);
  const attendanceByEmployee = new Map(attendance.map((record) => [record.employeeId, record.status]));
  const dateValue = date.toISOString().slice(0, 10);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Staff Attendance</h1>
        <p className="text-sm text-slate-500 mt-0.5">Record daily attendance for your team.</p>
      </div>

      <Card className="rounded-3xl border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="flex items-center gap-2 text-base"><CalendarCheck className="h-5 w-5 text-primary" /> Today&apos;s attendance</CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-slate-100">
          {employees.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-400">Add employees before recording attendance.</p>
          ) : employees.map((employee) => (
            <form key={employee.id} action={saveAttendance} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
              <input type="hidden" name="employeeId" value={employee.id} />
              <input type="hidden" name="date" value={dateValue} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">{employee.name}</p>
                <p className="text-xs text-slate-400">{employee.role || "Staff"}</p>
              </div>
              <select name="status" defaultValue={attendanceByEmployee.get(employee.id) || "present"} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700">
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="leave">On leave</option>
              </select>
              <Button type="submit" size="sm" className="rounded-xl">Save</Button>
            </form>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-base">Past attendance records</CardTitle>
          <p className="text-xs text-slate-500">Saved attendance history for each staff member, newest first.</p>
        </CardHeader>
        <CardContent className="p-0">
          {pastAttendance.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-400">No past attendance records yet.</p>
          ) : (
            <div className="max-h-[28rem] overflow-y-auto">
              <div className="divide-y divide-slate-100">
                {pastAttendance.map((record) => (
                  <div key={record.id} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{record.employee.name}</p>
                      <p className="text-xs text-slate-400">{new Date(record.date).toLocaleDateString("en-IN")}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
                      record.status === "present"
                        ? "bg-emerald-100 text-emerald-700"
                        : record.status === "absent"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700"
                    }`}>
                      {record.status === "leave" ? "On leave" : record.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
