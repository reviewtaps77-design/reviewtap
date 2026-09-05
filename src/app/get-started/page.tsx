import { redirect } from "next/navigation";
import { requireOwner, getSessionBusinessId } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { ensureComplaintDefaults } from "@/lib/complaint";
import { ensureAiPromptDefaults } from "@/lib/ai-prompt";
import Wizard from "./wizard";

export const metadata = { title: "Get Started | ReviewTap" };

export default async function GetStartedPage() {
  const session = await requireOwner();
  const businessId = getSessionBusinessId(session);

  const business = await db.business.findUnique({ where: { id: businessId } });
  if (!business) redirect("/login");
  if (business.setupCompleted) redirect("/dashboard");

  await Promise.all([ensureComplaintDefaults(businessId), ensureAiPromptDefaults(businessId)]);

  const [employees, tables, categories, aiOptions, settings] = await Promise.all([
    db.employee.findMany({
      where: { businessId },
      select: { id: true, name: true, employeeCode: true, role: true, department: true },
      orderBy: { name: "asc" },
    }),
    db.complaintTable.findMany({
      where: { businessId },
      select: { id: true, name: true, branch: true, status: true, _count: { select: { qrs: true } } },
      orderBy: { name: "asc" },
    }),
    db.complaintCategory.findMany({
      where: { businessId },
      select: { id: true, label: true, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    db.aiPromptOption.findMany({
      where: { businessId },
      select: { id: true, label: true, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    db.complaintSettings.findUnique({ where: { businessId } }),
  ]);

  return (
    <Wizard
      business={{
        id: business.id,
        name: business.name,
        phone: business.phone,
        category: business.category,
        address: business.address,
        description: business.description,
        googleReviewUrl: business.googleReviewUrl,
        brandColor: business.brandColor,
        logoUrl: business.logoUrl,
        coverUrl: business.coverUrl,
      }}
      initialEmployees={employees}
      initialTables={tables.map((t) => ({ ...t, qrCount: t._count.qrs }))}
      initialCategories={categories}
      initialAiOptions={aiOptions}
      initialSettings={
        settings
          ? { heading: settings.heading, description: settings.description, allowDescription: settings.allowDescription }
          : null
      }
    />
  );
}
