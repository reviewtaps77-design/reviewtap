import { db } from "./db";

/** Default per-business complaint options (used only when a business has none yet). */
export const DEFAULT_COMPLAINT_CATEGORIES = [
  "Slow Service",
  "Staff Behaviour",
  "Food Quality",
  "Price",
  "Cleanliness",
  "Other",
];

export const COMPLAINT_STATUSES = ["new", "in_progress", "resolved", "closed"] as const;
export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

export function complaintStatusLabel(status: string): string {
  if (status === "new") return "NEW";
  if (status === "in_progress") return "In Progress";
  if (status === "resolved") return "Resolved";
  if (status === "closed") return "Closed";
  return status;
}

/** Public customer URL encoded in the printed QR. Contains only the token,
 *  so branding/options/tables can change without reprinting. */
export function buildComplaintUrl(token: string): string {
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${appBaseUrl}/complaint/${token}`;
}

/** Creates default settings + categories for a business that has none yet. Idempotent. */
export async function ensureComplaintDefaults(businessId: string) {
  const [settings, categoryCount] = await Promise.all([
    db.complaintSettings.findUnique({ where: { businessId } }),
    db.complaintCategory.count({ where: { businessId } }),
  ]);

  if (!settings) {
    await db.complaintSettings.create({
      data: {
        businessId,
        heading: "What went wrong?",
        description: "Tell us what happened and we will make it right.",
        allowDescription: true,
      },
    });
  }

  if (categoryCount === 0) {
    await db.complaintCategory.createMany({
      data: DEFAULT_COMPLAINT_CATEGORIES.map((label, index) => ({
        businessId,
        label,
        sortOrder: index,
        isActive: true,
      })),
    });
  }
}

export type ComplaintQrResolution =
  | { ok: true; qr: any; business: any; table: any; settings: any; categories: any[] }
  | { ok: false; reason: "not_found" | "disabled" | "business_unavailable" };

/** Resolves a public complaint token to its live business/table/settings. No auth (customer-facing). */
export async function resolveComplaintQr(token: string): Promise<ComplaintQrResolution> {
  const qr = await db.complaintQr.findUnique({
    where: { token },
    include: {
      business: true,
      table: true,
    },
  });

  if (!qr) return { ok: false, reason: "not_found" };
  if (qr.status !== "active") return { ok: false, reason: "disabled" };
  if (!qr.business || qr.business.status !== "active") return { ok: false, reason: "business_unavailable" };

  const [settings, categories] = await Promise.all([
    db.complaintSettings.findUnique({ where: { businessId: qr.businessId } }),
    db.complaintCategory.findMany({
      where: { businessId: qr.businessId, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  return { ok: true, qr, business: qr.business, table: qr.table, settings, categories };
}
