"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hash } from "bcryptjs";
import { addMonths } from "date-fns";
import { sendWelcomeEmail, sendSubscriptionNotification } from "@/lib/email";
import { PLAN_DETAILS, SubscriptionPlan } from "@/types";
import { sanitizeEmail, sanitizePhone, sanitizeSlug, sanitizeText, sanitizeUrl, sanitizePassword } from "@/lib/security";
import { businessCreateSchema, parseValidated } from "@/lib/validation";

export async function createBusinessAndOwner(prevState: any, formData: FormData) {
  await requireAdmin();

  const parsedInput = parseValidated(businessCreateSchema, {
    businessName: formData.get("businessName"),
    slug: formData.get("slug"),
    ownerName: formData.get("ownerName"),
    ownerEmail: formData.get("ownerEmail"),
    ownerPhone: formData.get("ownerPhone"),
    googleReviewUrl: formData.get("googleReviewUrl"),
    plan: formData.get("plan") || "monthly",
    password: formData.get("password") || "ReviewTap@123",
  });

  if (!parsedInput.success) {
    return { error: "Invalid business details. Please check the form values and try again." };
  }

  const { businessName, slug, ownerName, ownerEmail, ownerPhone, googleReviewUrl, plan: rawPlan } = parsedInput.data;
  const customPassword = parsedInput.data.password ?? "ReviewTap@123";

  if (!businessName || !slug || !ownerName || !ownerEmail) {
    return { error: "Missing required fields: Business name, slug, owner name, and owner email are mandatory." };
  }

  try {
    const existingSlug = await db.business.findUnique({ where: { slug } });
    if (existingSlug) return { error: `Subdomain slug '${slug}' is already taken.` };

    const existingUser = await db.user.findUnique({ where: { email: ownerEmail } });
    if (existingUser) return { error: `A user with email '${ownerEmail}' already exists.` };

    const hashedPassword = await hash(customPassword, 12);

    let plan: SubscriptionPlan = "monthly";
    let months = 1;
    let amount = 2000;

    if (rawPlan === "6month" || rawPlan === "6-month") {
      plan = "6month";
      months = 6;
      amount = 12000;
    } else if (rawPlan === "12month" || rawPlan === "12-month") {
      plan = "12month";
      months = 12;
      amount = 24000;
    }

    const startDate = new Date();
    const expiryDate = addMonths(startDate, months);

    let createdBusinessId = "";

    await db.$transaction(async (tx) => {
      // 1. Create Business
      const business = await tx.business.create({
        data: {
          name: businessName,
          slug,
          ownerName,
          ownerEmail,
          ownerPhone,
          googleReviewUrl,
          status: "active",
        },
      });

      createdBusinessId = business.id;

      // 2. Create Owner User
      await tx.user.create({
        data: {
          name: ownerName,
          email: ownerEmail,
          passwordHash: hashedPassword,
          role: "business_owner",
          businessId: business.id,
        },
      });

      // 3. Create Subscription (No payment table)
      await tx.subscription.create({
        data: {
          businessId: business.id,
          plan: plan,
          amount,
          startDate,
          expiryDate,
          status: "active",
        },
      });

      // 4. Create Business QR record
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "reviewtap.in";
      const businessUrl = process.env.NODE_ENV === "production"
        ? `https://${slug}.${rootDomain}`
        : `http://localhost:3000?tenant=${slug}`;

      await tx.qrCode.create({
        data: {
          businessId: business.id,
          type: "business_qr",
          url: businessUrl,
          status: "active",
        },
      });
    });

    // Send Welcome Email (non-blocking for UX)
    try {
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "reviewtap.in";
      const dashboardUrl = process.env.NODE_ENV === "production"
        ? `https://${slug}.${rootDomain}/dashboard`
        : `http://localhost:3000/dashboard?tenant=${slug}`;

      await sendWelcomeEmail({
        to: ownerEmail,
        businessName,
        loginId: ownerEmail,
        tempPassword: customPassword,
        dashboardUrl,
      });
    } catch (emailErr) {
      console.warn("Failed to send welcome email:", emailErr);
    }
  } catch (error: any) {
    console.error("Failed to create business:", error);
    return { error: error?.message || "Failed to create business and owner account." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/businesses");
  revalidatePath("/admin/subscriptions");
  redirect("/admin/businesses");
}

export async function updateSubscriptionStatus(subscriptionId: string, status: "active" | "suspended" | "expired", newExpiry?: Date) {
  await requireAdmin();

  try {
    const updated = await db.subscription.update({
      where: { id: subscriptionId },
      data: {
        status,
        ...(newExpiry && { expiryDate: newExpiry }),
      },
      include: { business: true },
    });

    // Also update business status if subscription is suspended/expired
    if (status === "suspended" || status === "expired") {
      await db.business.update({
        where: { id: updated.businessId },
        data: { status },
      });
    } else if (status === "active") {
      await db.business.update({
        where: { id: updated.businessId },
        data: { status: "active" },
      });
    }

    try {
      await sendSubscriptionNotification({
        to: updated.business.ownerEmail,
        businessName: updated.business.name,
        plan: updated.plan,
        expiryDate: updated.expiryDate.toLocaleDateString("en-IN"),
        status,
      });
    } catch (e) {
      console.warn("Email notify failed:", e);
    }

    revalidatePath("/admin/subscriptions");
    revalidatePath("/admin/businesses");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update subscription:", error);
    return { error: error?.message || "Failed to update subscription." };
  }
}

export async function extendSubscription(subscriptionId: string, monthsToAdd: number) {
  await requireAdmin();

  try {
    const sub = await db.subscription.findUnique({ where: { id: subscriptionId } });
    if (!sub) return { error: "Subscription not found." };

    const baseDate = new Date(sub.expiryDate) > new Date() ? new Date(sub.expiryDate) : new Date();
    const newExpiry = addMonths(baseDate, monthsToAdd);

    await db.subscription.update({
      where: { id: subscriptionId },
      data: {
        expiryDate: newExpiry,
        status: "active",
      },
    });

    await db.business.update({
      where: { id: sub.businessId },
      data: { status: "active" },
    });

    revalidatePath("/admin/subscriptions");
    return { success: true, newExpiry };
  } catch (error: any) {
    console.error("Failed to extend subscription:", error);
    return { error: error?.message || "Failed to extend subscription." };
  }
}

export async function toggleBusinessStatus(id: string) {
  await requireAdmin();

  try {
    const business = await db.business.findUnique({ where: { id } });
    if (!business) return { error: "Business not found." };

    const newStatus = business.status === "active" ? "suspended" : "active";

    await db.business.update({
      where: { id },
      data: { status: newStatus },
    });

    revalidatePath("/admin/businesses");
    revalidatePath("/admin");
    return { success: true, status: newStatus };
  } catch (error: any) {
    console.error("Failed to toggle business status:", error);
    return { error: error?.message || "Failed to toggle business status." };
  }
}

export async function deleteBusiness(id: string) {
  await requireAdmin();

  try {
    await db.business.delete({
      where: { id },
    });

    revalidatePath("/admin/businesses");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete business:", error);
    return { error: error?.message || "Failed to delete business." };
  }
}
