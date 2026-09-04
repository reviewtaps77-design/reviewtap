"use server";

import { requireOwner, getSessionBusinessId } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import {
  ATTENDANCE_RETENTION_MONTHS,
  getAttendanceRetentionCutoff,
  purgeAttendanceOlderThan,
} from "@/lib/attendance-retention";
import { revalidatePath } from "next/cache";

export async function saveAttendance(formData: FormData) {
  const session = await requireOwner();
  const businessId = getSessionBusinessId(session);
  const employeeId = String(formData.get("employeeId") || "");
  const dateValue = String(formData.get("date") || "");
  const status = String(formData.get("status") || "present");

  if (!employeeId || !/^\d{4}-\d{2}-\d{2}$/.test(dateValue) || !["present", "absent", "leave"].includes(status)) {
    throw new Error("Please provide a valid employee, date, and attendance status.");
  }

  const employee = await db.employee.findFirst({ where: { id: employeeId, businessId } });
  if (!employee) throw new Error("Employee not found.");

  await db.attendance.upsert({
    where: { businessId_employeeId_date: { businessId, employeeId, date: new Date(`${dateValue}T00:00:00.000Z`) } },
    update: { status },
    create: { businessId, employeeId, date: new Date(`${dateValue}T00:00:00.000Z`), status },
  });

  // Enforce 6-month retention so history never grows unbounded.
  await db.attendance.deleteMany({
    where: { businessId, date: { lt: getAttendanceRetentionCutoff() } },
  });

  revalidatePath("/dashboard/attendance");
}

/** Manual purge of this business's attendance older than the retention window (default 6 months). */
export async function purgeOldAttendance(formData: FormData) {
  const session = await requireOwner();
  const businessId = getSessionBusinessId(session);

  const rawMonths = Number(formData.get("months") ?? ATTENDANCE_RETENTION_MONTHS);
  const months =
    Number.isFinite(rawMonths) && rawMonths >= 1 && rawMonths <= 120 ? Math.floor(rawMonths) : ATTENDANCE_RETENTION_MONTHS;

  await purgeAttendanceOlderThan({ businessId, months });

  revalidatePath("/dashboard/attendance");
}
