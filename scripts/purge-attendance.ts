/**
 * Purges attendance older than the retention window (default: last 6 months kept).
 * Cron-friendly standalone script (uses the same cutoff logic as the app).
 *
 * Usage:
 *   DATABASE_URL="mysql://user:pass@localhost:3306/reviewtap" npm run attendance:purge
 *   BUSINESS_SLUG=cafe-delight npm run attendance:purge   # limit to one business
 *   RETENTION_MONTHS=6 npm run attendance:purge
 *   DRY_RUN=1 npm run attendance:purge                    # report only, delete nothing
 */
import { db } from "@/lib/db";
import {
  ATTENDANCE_RETENTION_MONTHS,
  countAttendanceOutsideRetention,
  purgeAttendanceOlderThan,
} from "@/lib/attendance-retention";

async function main() {
  const slugFilter = process.env.BUSINESS_SLUG?.trim();
  const rawMonths = Number(process.env.RETENTION_MONTHS ?? ATTENDANCE_RETENTION_MONTHS);
  const months =
    Number.isFinite(rawMonths) && rawMonths >= 1 && rawMonths <= 120 ? Math.floor(rawMonths) : ATTENDANCE_RETENTION_MONTHS;
  const dryRun = process.env.DRY_RUN === "1";

  let businessId: string | undefined;
  if (slugFilter) {
    const business = await db.business.findUnique({ where: { slug: slugFilter }, select: { id: true } });
    if (!business) throw new Error(`No business found with slug "${slugFilter}".`);
    businessId = business.id;
  }

  if (dryRun) {
    const { cutoff, count } = await countAttendanceOutsideRetention({ businessId, months });
    console.log(
      `[dry-run] Would delete ${count} attendance record(s) older than ${cutoff.toISOString().slice(0, 10)} ` +
        `(keeping last ${months} month(s)${slugFilter ? ` for "${slugFilter}"` : ""}).`,
    );
    return;
  }

  const { cutoff, deletedCount } = await purgeAttendanceOlderThan({ businessId, months });
  console.log(
    `Purged ${deletedCount} attendance record(s) older than ${cutoff.toISOString().slice(0, 10)} ` +
      `(keeping last ${months} month(s)${slugFilter ? ` for "${slugFilter}"` : ""}).`,
  );

  const remaining = await db.attendance.count({ where: businessId ? { businessId } : {} });
  const oldest = await db.attendance.findFirst({
    where: businessId ? { businessId } : {},
    orderBy: { date: "asc" },
    select: { date: true },
  });
  console.log(`Remaining: ${remaining} record(s). Oldest: ${oldest?.date.toISOString().slice(0, 10) ?? "none"}.`);
}

main()
  .catch((e) => {
    console.error("Purge failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
