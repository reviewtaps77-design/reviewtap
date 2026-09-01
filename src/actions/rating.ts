"use server";

import { db } from "@/lib/db";
import { headers } from "next/headers";
import { createSession } from "@/lib/session-tracking";
import { revalidatePath } from "next/cache";
import { sanitizeNumber, sanitizeText } from "@/lib/security";

export async function submitEmployeeRating(data: {
  employeeSlug: string;
  ratings: { behaviour: number; fastness: number; overall: number };
  comment?: string;
  customerName?: string;
  sessionToken?: string;
}) {
  const headersList = await headers();
  const businessSlug = sanitizeText(headersList.get("x-business-slug") ?? null, 80);
  const userAgent = sanitizeText(headersList.get("user-agent") ?? null, 255) || undefined;
  const ip = sanitizeText(headersList.get("x-forwarded-for")?.split(",")[0] ?? null, 50) || undefined;

  if (!businessSlug) {
    throw new Error("Business not found");
  }

  const business = await db.business.findUnique({
    where: { slug: businessSlug },
  });

  if (!business) {
    throw new Error("Business not found");
  }

  const employeeSlug = sanitizeText(data.employeeSlug ?? null, 80);
  if (!employeeSlug) {
    throw new Error("Employee not found");
  }

  const employee = await db.employee.findUnique({
    where: {
      businessId_slug: {
        businessId: business.id,
        slug: employeeSlug,
      },
    },
  });

  if (!employee) {
    throw new Error("Employee not found");
  }

  const behaviour = sanitizeNumber(data.ratings?.behaviour, 1, 5);
  const fastness = sanitizeNumber(data.ratings?.fastness, 1, 5);
  const overall = sanitizeNumber(data.ratings?.overall, 1, 5);
  const sessionToken = sanitizeText(data.sessionToken ?? null, 255);

  if (behaviour === null || fastness === null || overall === null) {
    throw new Error("Invalid rating values");
  }

  // Ensure valid session
  let session = sessionToken
    ? await db.session.findUnique({ where: { sessionToken } })
    : null;

  if (!session) {
    session = await createSession({
      businessId: business.id,
      employeeId: employee.id,
      sourceType: "employee_qr",
      userAgent,
      ip,
    });
  }

  const rating = await db.employeeRating.create({
    data: {
      businessId: business.id,
      employeeId: employee.id,
      sessionId: session.id,
      behaviour,
      fastness,
      overall,
      comment: sanitizeText(data.comment ?? null, 1200) || null,
      customerName: sanitizeText(data.customerName ?? null, 120) || null,
    },
  });

  revalidatePath("/dashboard/employees");
  revalidatePath(`/dashboard/employees/${employee.id}`);
  revalidatePath("/dashboard/analytics");
  revalidatePath("/dashboard");

  return {
    success: true,
    ratingId: rating.id,
    sessionToken: session.sessionToken,
    employeeName: employee.name,
  };
}
