import { requireOwner, getSessionBusinessId } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { saveAttendance, purgeOldAttendance } from "@/actions/attendance";
import {
  ATTENDANCE_RETENTION_MONTHS,
  getAttendanceRetentionCutoff,
} from "@/lib/attendance-retention";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AttendanceCalendar } from "@/components/attendance-calendar";
import { SubmitButton } from "@/components/submit-button";
import { CalendarCheck, CalendarDays, DatabaseBackup } from "lucide-react";

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
    }),
  ]);
  const attendanceByEmployee = new Map(attendance.map((record) => [record.employeeId, record.status]));
  const attendanceByEmployeeId = new Map<string, typeof pastAttendance>();
  pastAttendance.forEach((record) => {
    const records = attendanceByEmployeeId.get(record.employeeId) || [];
    records.push(record);
    attendanceByEmployeeId.set(record.employeeId, records);
  });
  const recentDates = Array.from({ length: 5 }, (_, index) => {
    const recentDate = new Date(date);
    recentDate.setUTCDate(date.getUTCDate() - index);
    return recentDate;
  });
  const dateValue = date.toISOString().slice(0, 10);

  // 6-month retention window: only records on/after this date are kept.
  const retentionCutoff = getAttendanceRetentionCutoff();
  const retentionOverflowCount = await db.attendance.count({
    where: { businessId, date: { lt: retentionCutoff } },
  });

  // Rolling 1-month (last 30 days, inclusive) totals
  const monthStart = new Date(date);
  monthStart.setUTCDate(date.getUTCDate() - 29);

  const monthlyRecords = pastAttendance.filter(
    (record) => new Date(record.date) >= monthStart,
  );

  const monthlyTotals = monthlyRecords.reduce(
    (acc, record) => {
      if (record.status === "present") acc.present += 1;
      else if (record.status === "absent") acc.absent += 1;
      else if (record.status === "leave") acc.leave += 1;
      return acc;
    },
    { present: 0, absent: 0, leave: 0 },
  );

  const monthlyTotalsByEmployee = new Map<string, { present: number; absent: number; leave: number }>();
  monthlyRecords.forEach((record) => {
    const totals = monthlyTotalsByEmployee.get(record.employeeId) || { present: 0, absent: 0, leave: 0 };
    if (record.status === "present") totals.present += 1;
    else if (record.status === "absent") totals.absent += 1;
    else if (record.status === "leave") totals.leave += 1;
    monthlyTotalsByEmployee.set(record.employeeId, totals);
  });

  // Serialized props for the client-side calendar view.
  const calendarEmployees = employees.map((employee) => ({
    id: employee.id,
    name: employee.name,
    role: employee.role,
  }));
  const calendarRecords = pastAttendance.map((record) => ({
    employeeId: record.employeeId,
    date: new Date(record.date).toISOString().slice(0, 10),
    status: record.status,
  }));

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Staff Attendance</h1>
        <p className="text-sm text-slate-500 mt-0.5">Record daily attendance for your team.</p>
      </div>

      <Card className="rounded-3xl border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <CardContent className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
          <div className="flex items-center gap-3 flex-1">
            <DatabaseBackup className="h-5 w-5 text-primary shrink-0" />
            <p className="text-xs text-slate-600">
              Only the last {ATTENDANCE_RETENTION_MONTHS} months are kept (since{" "}
              {retentionCutoff.toLocaleDateString("en-IN")}). Saving attendance auto-deletes anything older.{" "}
              {retentionOverflowCount > 0 ? (
                <span className="font-semibold text-amber-700">{retentionOverflowCount} old record(s) pending purge.</span>
              ) : (
                <span className="font-semibold text-emerald-700">History is within the retention window.</span>
              )}
            </p>
          </div>
          <form action={purgeOldAttendance} className="w-full sm:w-auto">
            <input type="hidden" name="months" value={ATTENDANCE_RETENTION_MONTHS} />
            <SubmitButton type="submit" size="sm" variant="outline" className="w-full rounded-xl sm:w-auto sm:whitespace-nowrap" pendingText="Purging…">
              Delete older than {ATTENDANCE_RETENTION_MONTHS} months
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

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
              <select name="status" defaultValue={attendanceByEmployee.get(employee.id) || "present"} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 sm:w-auto">
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="leave">On leave</option>
              </select>
              <SubmitButton type="submit" size="sm" className="w-full rounded-xl sm:w-auto" pendingText="Saving…">Save</SubmitButton>
            </form>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-base">Past attendance records</CardTitle>
          <p className="text-xs text-slate-500">Quick per-staff summary. See the calendar above for full day-wise history.</p>
          <div className="mt-3 flex flex-wrap gap-2" aria-label="Last 30 days attendance totals">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">
              Present: {monthlyTotals.present}
            </span>
            <span className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-semibold text-rose-700">
              Absent: {monthlyTotals.absent}
            </span>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-700">
              On leave: {monthlyTotals.leave}
            </span>
            <span className="px-1 py-1 text-[11px] font-medium text-slate-400">
              Last 30 days ({monthStart.toLocaleDateString("en-IN")} – {date.toLocaleDateString("en-IN")})
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {pastAttendance.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-400">No past attendance records yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {employees.map((employee) => {
                const employeeRecords = attendanceByEmployeeId.get(employee.id) || [];
                const empMonthly = monthlyTotalsByEmployee.get(employee.id) || { present: 0, absent: 0, leave: 0 };
                const recordsByDate = new Map(
                  employeeRecords.map((record) => [new Date(record.date).toISOString().slice(0, 10), record]),
                );

                return (
                  <div key={employee.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3 rounded-xl">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{employee.name}</p>
                        <p className="text-xs text-slate-400">
                          Last 5 days • Last 30 days:{" "}
                          <span className="font-semibold text-emerald-600">P {empMonthly.present}</span>
                          {" / "}
                          <span className="font-semibold text-rose-600">A {empMonthly.absent}</span>
                          {" / "}
                          <span className="font-semibold text-amber-600">L {empMonthly.leave}</span>
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <div className="flex gap-1.5" aria-label={`Last 5 days attendance for ${employee.name}`}>
                          {recentDates.map((recentDate) => {
                            const record = recordsByDate.get(recentDate.toISOString().slice(0, 10));
                            const status = record?.status;
                            const dotClass = status === "present"
                              ? "bg-emerald-500"
                              : status === "absent"
                                ? "bg-rose-500"
                                : status === "leave"
                                  ? "bg-amber-400"
                                  : "bg-slate-200";

                            return (
                              <span
                                key={recentDate.toISOString()}
                                title={`${recentDate.toLocaleDateString("en-IN")}: ${status === "leave" ? "On leave" : status || "Not recorded"}`}
                                className={`h-3 w-3 rounded-full ${dotClass}`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-5 w-5 text-primary" /> Attendance calendar
          </CardTitle>
          <p className="text-xs text-slate-500">Month view of history per staff member. Hover any day for details.</p>
        </CardHeader>
        <CardContent className="p-0">
          <AttendanceCalendar employees={calendarEmployees} records={calendarRecords} />
        </CardContent>
      </Card>
    </div>
  );
}
