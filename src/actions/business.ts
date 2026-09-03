"use server";

import { requireOwner, getSessionBusinessId } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { sanitizeHexColor, sanitizePhone, sanitizeText, sanitizeUrl } from "@/lib/security";
import { businessProfileSchema, parseValidated } from "@/lib/validation";

export async function updateBusinessProfile(formData: FormData) {
  try {
    const session = await requireOwner();
    const businessId = getSessionBusinessId(session);

    const parsedInput = parseValidated(businessProfileSchema, {
      name: formData.get("name"),
      phone: formData.get("phone"),
      website: formData.get("website"),
      address: formData.get("address"),
      category: formData.get("category"),
      description: formData.get("description"),
      googleReviewUrl: formData.get("googleReviewUrl"),
      brandColor: formData.get("brandColor") || "#2563eb",
      logoUrl: formData.get("logoUrl"),
      coverUrl: formData.get("coverUrl"),
    });

    if (!parsedInput.success) {
      return { success: false, error: "Invalid business profile values." };
    }

    const { name, phone, website, address, category, description, googleReviewUrl, brandColor, logoUrl, coverUrl } = parsedInput.data;

    if (!name) {
      return { success: false, error: "Business name is required." };
    }

    await db.business.update({
      where: { id: businessId },
      data: {
        name,
        phone,
        website,
        address,
        category,
        description,
        googleReviewUrl,
        brandColor,
        ...(logoUrl !== undefined && { logoUrl }),
        ...(coverUrl !== undefined && { coverUrl }),
      },
    });

    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard");
    revalidatePath("/tenant");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to update business profile:", error);
    return { success: false, error: error?.message || "Failed to update profile." };
  }
}

export async function saveBusinessImage(kind: "logo" | "cover", url: string) {
  const session = await requireOwner();
  const businessId = getSessionBusinessId(session);
  const imageUrl = sanitizeUrl(url);

  if (!imageUrl) return { success: false, error: "Invalid uploaded image URL." };

  try {
    await db.business.update({
      where: { id: businessId },
      data: kind === "logo" ? { logoUrl: imageUrl } : { coverUrl: imageUrl },
    });
  } catch (error) {
    console.error("Failed to save business image:", error);
    return { success: false, error: "The image uploaded, but the database update failed." };
  }

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  revalidatePath("/tenant");
  return { success: true };
}

