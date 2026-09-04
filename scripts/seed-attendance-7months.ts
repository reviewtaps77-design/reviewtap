/**
 * Seeds 7 months of dummy attendance (one record per employee per day).
 *
 * Usage:
 *   DATABASE_URL="mysql://user:pass@localhost:3306/reviewtap" npm run attendance:seed
 *   BUSINESS_SLUG=cafe-delight npm run attendance:seed   # limit to one business
 *
 * Idempotent: uses createMany + skipDuplicates, so re-runs only fill gaps.
 */
import { db } from "@/lib/db";

const DAYS_TO_SEED = 7 * 30; // 7 months x 30 days = 210 days (today + 209 days back)

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Deterministic PRNG so re-runs produce identical statuses.
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickStatus(rand: () => number): "present" | "absent" | "leave" {
  const r = rand();
  if (r < 0.8) return "present";
  if (r < 0.92) return "leave";
  return "absent";
}

async function main() {
  const slugFilter = process.env.BUSINESS_SLUG?.trim();

  const businesses = await db.business.findMany({
    where: slugFilter ? { slug: slugFilter } : {},
    include: { employees: { select: { id: true, name: true } } },
  });

  if (businesses.length === 0) {
    throw new Error(slugFilter ? `No business found with slug "${slugFilter}".` : "No businesses found.");
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let total = 0;
  for (const business of businesses) {
    if (business.employees.length === 0) {
      console.log(`- ${business.slug}: no employees, skipped.`);
      continue;
    }
    let businessCount = 0;
    for (const employee of business.employees) {
      const rand = mulberry32(hashSeed(`${business.id}:${employee.id}`));
      const rows: { businessId: string; employeeId: string; date: Date; status: string }[] = [];
      for (let daysAgo = DAYS_TO_SEED - 1; daysAgo >= 0; daysAgo--) {
        const date = new Date(today);
        date.setUTCDate(today.getUTCDate() - daysAgo);
        rows.push({ businessId: business.id, employeeId: employee.id, date, status: pickStatus(rand) });
      }
      const result = await db.attendance.createMany({ data: rows, skipDuplicates: true });
      businessCount += result.count;
    }
    total += businessCount;
    console.log(`- ${business.slug}: +${businessCount} records (${business.employees.length} employees x ${DAYS_TO_SEED} days).`);
  }

  const oldest = await db.attendance.findFirst({ orderBy: { date: "asc" }, select: { date: true } });
  const newest = await db.attendance.findFirst({ orderBy: { date: "desc" }, select: { date: true } });
  console.log(`Done. Inserted ${total} new records. Range: ${oldest?.date.toISOString().slice(0, 10)} -> ${newest?.date.toISOString().slice(0, 10)}.`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
