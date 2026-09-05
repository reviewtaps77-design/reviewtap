"use server";

import { requireOwner, getSessionBusinessId } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { aiPromptOptionSchema, parseValidated } from "@/lib/validation";

function revalidateAiPromptDashboard() {
  revalidatePath("/dashboard/qr-nfc");
  revalidatePath("/dashboard");
}

export async function createAiPromptOption(formData: FormData) {
  try {
    const session = await requireOwner();
    const businessId = getSessionBusinessId(session);

    const parsed = parseValidated(aiPromptOptionSchema, {
      label: formData.get("label"),
      isActive: formData.get("isActive") !== "false",
    });
    if (!parsed.success || !parsed.data.label) {
      return { success: false, error: "Option label is required." };
    }

    const maxOrder = await db.aiPromptOption.findFirst({
      where: { businessId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const option = await db.aiPromptOption.create({
      data: {
        businessId,
        label: parsed.data.label,
        sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
        isActive: parsed.data.isActive,
      },
    });

    revalidateAiPromptDashboard();
    return { success: true, optionId: option.id };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to add option." };
  }
}

export async function updateAiPromptOption(id: string, formData: FormData) {
  try {
    const session = await requireOwner();
    const businessId = getSessionBusinessId(session);

    const parsed = parseValidated(aiPromptOptionSchema, {
      label: formData.get("label"),
      isActive: formData.get("isActive") !== "false",
    });
    if (!parsed.success || !parsed.data.label) {
      return { success: false, error: "Option label is required." };
    }

    await db.aiPromptOption.update({
      where: { id, businessId },
      data: { label: parsed.data.label, isActive: parsed.data.isActive },
    });

    revalidateAiPromptDashboard();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to update option." };
  }
}

export async function toggleAiPromptOption(id: string) {
  try {
    const session = await requireOwner();
    const businessId = getSessionBusinessId(session);

    const option = await db.aiPromptOption.findFirst({ where: { id, businessId } });
    if (!option) return { success: false, error: "Option not found." };

    await db.aiPromptOption.update({ where: { id }, data: { isActive: !option.isActive } });

    revalidateAiPromptDashboard();
    return { success: true, isActive: !option.isActive };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to update option." };
  }
}

export async function moveAiPromptOption(id: string, direction: "up" | "down") {
  try {
    const session = await requireOwner();
    const businessId = getSessionBusinessId(session);

    const ordered = await db.aiPromptOption.findMany({
      where: { businessId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    const index = ordered.findIndex((o) => o.id === id);
    if (index === -1) return { success: false, error: "Option not found." };

    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= ordered.length) return { success: true };

    const [a, b] = [ordered[index], ordered[swapIndex]];
    await db.$transaction([
      db.aiPromptOption.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
      db.aiPromptOption.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
    ]);

    revalidateAiPromptDashboard();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to reorder options." };
  }
}

export async function deleteAiPromptOption(id: string) {
  try {
    const session = await requireOwner();
    const businessId = getSessionBusinessId(session);

    await db.aiPromptOption.delete({ where: { id, businessId } });

    revalidateAiPromptDashboard();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to delete option." };
  }
}
