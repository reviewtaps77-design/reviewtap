import { headers } from "next/headers";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import EmployeeRatingForm from "./rating-form";

export default async function EmployeeLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const headersList = await headers();
  const businessSlug = headersList.get("x-business-slug");
  const business = businessSlug ? await db.business.findUnique({ where: { slug: businessSlug }, select: { id: true } }) : null;
  const employee = business
    ? await db.employee.findUnique({ where: { businessId_slug: { businessId: business.id, slug } } })
    : null;
  if (!employee) notFound();
  return <EmployeeRatingForm employeeName={employee.name} />;
}
