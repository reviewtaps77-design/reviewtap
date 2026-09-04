"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarEmployee {
  id: string;
  name: string;
  role: string | null;
}

interface CalendarRecord {
  employeeId: string;
  /** yyyy-mm-dd (UTC) */
  date: string;
  status: string;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function statusLabel(status?: string) {
  if (status === "present") return "Present";
  if (status === "absent") return "Absent";
  if (status === "leave") return "On leave";
  return "Not recorded";
}

export function AttendanceCalendar({
  employees,
  records,
}: {
  employees: CalendarEmployee[];
  records: CalendarRecord[];
}) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayKey = today.toISOString().slice(0, 10);

  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "");
  const [viewYear, setViewYear] = useState(today.getUTCFullYear());
  const [viewMonth, setViewMonth] = useState(today.getUTCMonth());

  const statusByDate = useMemo(() => {
    const map = new Map<string, string>();
    for (const record of records) {
      if (record.employeeId === employeeId) map.set(record.date, record.status);
    }
    return map;
  }, [records, employeeId]);

  const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;

  const monthTotals = useMemo(() => {
    const totals = { present: 0, absent: 0, leave: 0 };
    statusByDate.forEach((status, date) => {
      if (!date.startsWith(prefix)) return;
      if (status === "present") totals.present += 1;
      else if (status === "absent") totals.absent += 1;
      else if (status === "leave") totals.leave += 1;
    });
    return totals;
  }, [statusByDate, prefix]);

  // Monday-first grid: leading blanks + every day of the month.
  const firstWeekdayOffset = (new Date(Date.UTC(viewYear, viewMonth, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();
  const cells: (string | null)[] = [
    ...Array<string | null>(firstWeekdayOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => toKey(viewYear, viewMonth, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const isCurrentMonth = viewYear === today.getUTCFullYear() && viewMonth === today.getUTCMonth();

  const shiftMonth = (delta: number) => {
    const shifted = new Date(Date.UTC(viewYear, viewMonth + delta, 1));
    setViewYear(shifted.getUTCFullYear());
    setViewMonth(shifted.getUTCMonth());
  };

  const goToToday = () => {
    setViewYear(today.getUTCFullYear());
    setViewMonth(today.getUTCMonth());
  };

  const selectedEmployee = employees.find((e) => e.id === employeeId);
  const monthLabel = new Date(Date.UTC(viewYear, viewMonth, 1)).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  if (employees.length === 0) {
    return <p className="p-8 text-center text-sm text-slate-400">Add employees to view the attendance calendar.</p>;
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-3 p-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <select
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 sm:w-auto"
          aria-label="Select employee"
        >
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
            </option>
          ))}
        </select>

        <div className="flex w-full items-center justify-center gap-1 sm:ml-auto sm:w-auto sm:justify-end">
          <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => shiftMonth(-1)} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="min-w-32 flex-1 text-center text-sm font-bold text-slate-900 sm:flex-none sm:min-w-36">{monthLabel}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => shiftMonth(1)}
            disabled={isCurrentMonth}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {!isCurrentMonth && (
            <Button type="button" variant="ghost" size="sm" className="rounded-xl text-xs" onClick={goToToday}>
              Today
            </Button>
          )}
        </div>
      </div>

      {selectedEmployee && (
        <p className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-800">{selectedEmployee.name}</span>
          {selectedEmployee.role ? ` (${selectedEmployee.role})` : ""} —{" "}
          <span className="font-semibold text-emerald-600">P {monthTotals.present}</span>
          {" / "}
          <span className="font-semibold text-rose-600">A {monthTotals.absent}</span>
          {" / "}
          <span className="font-semibold text-amber-600">L {monthTotals.leave}</span>
          {" "}this month
        </p>
      )}

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
          <p key={day} className="pb-1 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {day}
          </p>
        ))}

        {cells.map((dateKey, index) => {
          if (!dateKey) return <span key={`blank-${index}`} />;
          const status = statusByDate.get(dateKey);
          const isFuture = dateKey > todayKey;
          const isToday = dateKey === todayKey;
          const dayNumber = Number(dateKey.slice(8, 10));

          const colorClass = isFuture
            ? "bg-slate-50 text-slate-300 border-slate-100"
            : status === "present"
              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
              : status === "absent"
                ? "bg-rose-100 text-rose-800 border-rose-200"
                : status === "leave"
                  ? "bg-amber-100 text-amber-800 border-amber-200"
                  : "bg-white text-slate-400 border-slate-200";

          return (
            <span
              key={dateKey}
              title={`${new Date(`${dateKey}T00:00:00.000Z`).toLocaleDateString("en-IN", { timeZone: "UTC" })}: ${statusLabel(status)}`}
              className={`flex h-8 items-center justify-center rounded-lg border text-xs font-semibold ${colorClass} ${
                isToday ? "ring-2 ring-primary ring-offset-1" : ""
              }`}
            >
              {dayNumber}
            </span>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-[11px] font-medium text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-emerald-500" /> Present
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-rose-500" /> Absent
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-amber-400" /> On leave
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border border-slate-300 bg-white" /> Not recorded
        </span>
      </div>
    </div>
  );
}
