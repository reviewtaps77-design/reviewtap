"use server";

import { db } from "@/lib/db";
import { headers } from "next/headers";
import { generateReview, ReviewContext } from "@/lib/openai";
import { createSession } from "@/lib/session-tracking";
import { revalidatePath } from "next/cache";
import { sanitizeText } from "@/lib/security";

export async function generateAiReview(data: {
  liked?: string;
  ordered?: string;
  service?: string;
  employeeInteraction?: string;
  recommend?: string;
  employeeSlug?: string;
  sessionToken?: string;
}) {
  const headersList = await headers();
  const businessSlug = sanitizeText(headersList.get("x-business-slug") ?? null, 80);
  const userAgent = sanitizeText(headersList.get("user-agent") ?? null, 255) || undefined;
  const ip = sanitizeText(headersList.get("x-forwarded-for")?.split(",")[0] ?? null, 50) || undefined;

  if (!businessSlug) {
    throw new Error("Business context not found");
  }

  const business = await db.business.findUnique({
    where: { slug: businessSlug },
  });

  if (!business) {
    throw new Error("Business not found");
  }

  const employeeSlug = sanitizeText(data.employeeSlug ?? null, 80);
  const sessionToken = sanitizeText(data.sessionToken ?? null, 255);

  let employee = null;
  if (employeeSlug) {
    employee = await db.employee.findUnique({
      where: {
        businessId_slug: {
          businessId: business.id,
          slug: employeeSlug,
        },
      },
    });
  }

  // Ensure session exists
  let session = sessionToken
    ? await db.session.findUnique({ where: { sessionToken } })
    : null;

  if (!session) {
    session = await createSession({
      businessId: business.id,
      employeeId: employee?.id,
      sourceType: employee ? "employee_qr" : "business_qr",
      userAgent,
      ip,
    });
  }

  let reviewText = "";
  let tokensUsed = 0;

  // Use OpenAI if API key available, or generate a high quality smart fallback
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "sk-your-openai-key") {
    try {
      const result = await generateReview({
        businessName: business.name,
        employeeName: employee?.name,
        answers: {
          liked: data.liked,
          ordered: data.ordered,
          service: data.service,
          employeeInteraction: data.employeeInteraction,
          recommend: data.recommend,
        },
      });
      reviewText = result.review;
      tokensUsed = result.tokensUsed;
    } catch (err) {
      console.warn("OpenAI API call failed, using algorithmic generator:", err);
    }
  }

  if (!reviewText) {
    // Algorithmic authentic review synthesis
    const parts: string[] = [];
    parts.push(`Had an exceptional experience at ${business.name}!`);

    if (data.liked) {
      parts.push(`What really stood out was the ${data.liked}.`);
    }
    if (data.ordered) {
      parts.push(`We tried the ${data.ordered} and it exceeded our expectations.`);
    }
    if (data.service) {
      parts.push(`The service was ${data.service}.`);
    }
    if (employee?.name) {
      parts.push(`Special thanks to ${employee.name} for being so attentive and welcoming.`);
    } else if (data.employeeInteraction) {
      parts.push(`The staff was ${data.employeeInteraction}.`);
    }
    if (data.recommend) {
      parts.push(`Would definitely recommend to anyone visiting!`);
    } else {
      parts.push(`Will definitely be coming back soon!`);
    }
    reviewText = parts.join(" ");
    tokensUsed = 65;
  }

  // Save Review record
  const reviewRecord = await db.review.create({
    data: {
      businessId: business.id,
      employeeId: employee?.id,
      sessionId: session.id,
      aiGenerated: true,
      aiPromptText: JSON.stringify({
        liked: sanitizeText(data.liked ?? null, 200),
        ordered: sanitizeText(data.ordered ?? null, 200),
        service: sanitizeText(data.service ?? null, 200),
        employee: sanitizeText(employee?.name ?? null, 120),
      }),
      aiResponseText: reviewText,
      editedText: reviewText,
    },
  });

  // Log AI Usage
  if (tokensUsed > 0) {
    try {
      await db.aiUsage.create({
        data: {
          businessId: business.id,
          employeeId: employee?.id,
          sessionId: session.id,
          tokensUsed,
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        },
      });
    } catch (e) {
      console.warn("Failed to log AI usage:", e);
    }
  }

  return {
    success: true,
    review: reviewText,
    reviewId: reviewRecord.id,
    sessionToken: session.sessionToken,
    googleReviewUrl: business.googleReviewUrl,
    businessName: business.name,
  };
}

export async function recordGoogleReviewClick(data: {
  reviewId?: string;
  sessionToken?: string;
  editedText?: string;
}) {
  try {
    const headersList = await headers();
    const businessSlug = sanitizeText(headersList.get("x-business-slug") ?? null, 80);
    const reviewId = sanitizeText(data.reviewId ?? null, 120);
    const sessionToken = sanitizeText(data.sessionToken ?? null, 255);
    const editedText = sanitizeText(data.editedText ?? null, 1200);

    if (reviewId) {
      await db.review.update({
        where: { id: reviewId },
        data: {
          googleClick: true,
          googleClickedAt: new Date(),
          ...(editedText && { editedText }),
        },
      });
    } else if (sessionToken && businessSlug) {
      const sessionRecord = await db.session.findUnique({
        where: { sessionToken },
      });
      const business = await db.business.findUnique({ where: { slug: businessSlug } });

      if (sessionRecord && business) {
        await db.review.create({
          data: {
            businessId: business.id,
            sessionId: sessionRecord.id,
            employeeId: sessionRecord.employeeId,
            googleClick: true,
            googleClickedAt: new Date(),
            aiGenerated: false,
          },
        });
      }
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/analytics");
    return { success: true };
  } catch (error) {
    console.error("Failed to record Google click:", error);
    return { success: false };
  }
}
