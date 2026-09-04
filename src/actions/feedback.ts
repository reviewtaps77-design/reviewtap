"use server";

import { db } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireOwner, getSessionBusinessId } from "@/lib/auth-guard";
import { sanitizeEmail, sanitizeText } from "@/lib/security";
import { feedbackSchema, parseValidated } from "@/lib/validation";

export async function submitPrivateFeedback(data: {
  name?: string;
  email?: string;
  rating: number;
  liked?: string;
  improve?: string;
  comments?: string;
  employeeSlug?: string;
  sessionToken?: string;
}) {
  const headersList = await headers();
  const businessSlug = headersList.get("x-business-slug");

  if (!businessSlug) {
    throw new Error("Business context not found");
  }

  const business = await db.business.findUnique({
    where: { slug: businessSlug },
  });

  if (!business) {
    throw new Error("Business not found");
  }

  const parsedInput = parseValidated(feedbackSchema, data);
  if (!parsedInput.success) {
    throw new Error("Invalid feedback input");
  }

  const { employeeSlug, sessionToken, rating, name, email, liked, improve, comments } = parsedInput.data;

  let employeeId: string | null = null;
  if (employeeSlug) {
    const emp = await db.employee.findUnique({
      where: {
        businessId_slug: {
          businessId: business.id,
          slug: employeeSlug,
        },
      },
    });
    if (emp) employeeId = emp.id;
  }

  let sessionId: string | null = null;
  if (sessionToken) {
    const sessionRecord = await db.session.findUnique({
      where: { sessionToken },
    });
    if (sessionRecord) sessionId = sessionRecord.id;
  }

  const feedback = await db.feedback.create({
    data: {
      businessId: business.id,
      employeeId,
      sessionId,
      rating,
      customerName: name || null,
      customerEmail: email || null,
      liked: liked || null,
      improve: improve || null,
      comments: comments || null,
      status: "unread",
    },
  });

  revalidatePath("/dashboard/complaints-and-feedback");
  revalidatePath("/dashboard");

  return { success: true, id: feedback.id };
}

export async function updateFeedbackStatus(feedbackId: string, status: "unread" | "read" | "resolved") {
  try {
    const session = await requireOwner();
    const businessId = getSessionBusinessId(session);

    await db.feedback.update({
      where: {
        id: feedbackId,
        businessId, // Tenant isolation check
      },
      data: { status },
    });

    revalidatePath("/dashboard/complaints-and-feedback");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update feedback status:", error);
    return { success: false, error: error?.message || "Failed to update feedback" };
  }
}

export async function deleteFeedback(feedbackId: string) {
  try {
    const session = await requireOwner();
    const businessId = getSessionBusinessId(session);

    await db.feedback.delete({
      where: {
        id: feedbackId,
        businessId, // Tenant isolation check
      },
    });

    revalidatePath("/dashboard/complaints-and-feedback");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete feedback:", error);
    return { success: false, error: error?.message || "Failed to delete feedback" };
  }
}
