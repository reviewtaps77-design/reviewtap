import { subMonths } from "date-fns";
import { db } from "./db";

/** How many months of attendance history are kept. Anything older is purged. */
export const ATTENDANCE_RETENTION_MONTHS = 6;

/** Midnight-UTC cutoff: records with `date` older than this fall outside retention. */
export function getAttendanceRetentionCutoff(months = ATTENDANCE_RETENTION_MONTHS, now = new Date()): Date {
  const startOfToday = new Date(now);
  startOfToday.setUTCHours(0, 0, 0, 0);
  return subMonths(startOfToday, months);
}

/**
 * Deletes attendance records older than the retention window.
 * Pass a businessId to purge one tenant, or omit it to purge globally (cron/admin).
 */
export async function purgeAttendanceOlderThan(args: { businessId?: string; months?: number } = {}) {
  const { businessId, months = ATTENDANCE_RETENTION_MONTHS } = args;
  const cutoff = getAttendanceRetentionCutoff(months);

  const deleted = await db.attendance.deleteMany({
    where: {
      ...(businessId ? { businessId } : {}),
      date: { lt: cutoff },
    },
  });

  return { cutoff, deletedCount: deleted.count };
}

/** Counts attendance records that fall outside the retention window (dry-run helper). */
export async function countAttendanceOutsideRetention(args: { businessId?: string; months?: number } = {}) {
  const { businessId, months = ATTENDANCE_RETENTION_MONTHS } = args;
  const cutoff = getAttendanceRetentionCutoff(months);

  const count = await db.attendance.count({
    where: {
      ...(businessId ? { businessId } : {}),
      date: { lt: cutoff },
    },
  });

  return { cutoff, count };
}
