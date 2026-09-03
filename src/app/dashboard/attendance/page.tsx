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

  const [employees, attendance] = await Promise.all([
    db.employee.findMany({ where: { businessId }, orderBy: { name: "asc" } }),
    db.attendance.findMany({ where: { businessId, date }, select: { employeeId: true, status: true } }),
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
    </div>
  );
}
