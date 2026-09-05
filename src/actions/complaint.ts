"use server";

import { requireOwner, getSessionBusinessId } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import {
  COMPLAINT_STATUSES,
  buildComplaintUrl,
  ensureComplaintDefaults,
  resolveComplaintQr,
} from "@/lib/complaint";
import { revalidatePath } from "next/cache";
import {
  complaintCategorySchema,
  complaintNoteSchema,
  complaintQrSchema,
  complaintSettingsSchema,
  complaintStatusSchema,
  complaintSubmitSchema,
  complaintTableSchema,
  parseValidated,
} from "@/lib/validation";

function revalidateComplaintDashboard() {
  revalidatePath("/dashboard/complaints-and-feedback");
  revalidatePath("/dashboard/qr-nfc");
  revalidatePath("/dashboard");
}

// ---------------------------------------------------------------- Tables ---

export async function createComplaintTable(formData: FormData) {
  try {
    const session = await requireOwner();
    const businessId = getSessionBusinessId(session);

    const parsed = parseValidated(complaintTableSchema, {
      name: formData.get("name"),
      branch: formData.get("branch"),
      status: formData.get("status") || "active",
    });
    if (!parsed.success || !parsed.data.name) {
      return { success: false, error: "Spot name is required." };
    }

    const existing = await db.complaintTable.findUnique({
      where: { businessId_name: { businessId, name: parsed.data.name } },
    });
    if (existing) return { success: false, error: `Spot '${parsed.data.name}' already exists.` };

    // Creating a spot automatically creates its Complaint QR (same transaction),
    // so owners never have to wire QRs manually. The printed QR stays valid forever.
    const result = await db.$transaction(async (tx) => {
      const table = await tx.complaintTable.create({
        data: {
          businessId,
          name: parsed.data.name,
          branch: parsed.data.branch || null,
          status: parsed.data.status,
        },
      });

      const qr = await tx.complaintQr.create({
        data: {
          businessId,
          tableId: table.id,
          status: parsed.data.status === "active" ? "active" : "disabled",
        },
      });

      return { table, qr };
    });

    revalidateComplaintDashboard();
    return { success: true, tableId: result.table.id, qrId: result.qr.id, url: buildComplaintUrl(result.qr.token) };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to create spot." };
  }
}

export async function updateComplaintTable(id: string, formData: FormData) {
  try {
    const session = await requireOwner();
    const businessId = getSessionBusinessId(session);

    const parsed = parseValidated(complaintTableSchema, {
      name: formData.get("name"),
      branch: formData.get("branch"),
      status: formData.get("status") || "active",
    });
    if (!parsed.success || !parsed.data.name) {
      return { success: false, error: "Spot name is required." };
    }

    await db.complaintTable.update({
      where: { id, businessId },
      data: {
        name: parsed.data.name,
        branch: parsed.data.branch || null,
        status: parsed.data.status,
      },
    });

    revalidateComplaintDashboard();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to update spot." };
  }
}

export async function toggleComplaintTableStatus(id: string) {
  try {
    const session = await requireOwner();
    const businessId = getSessionBusinessId(session);

    const table = await db.complaintTable.findFirst({ where: { id, businessId } });
    if (!table) return { success: false, error: "Spot not found." };

    const status = table.status === "active" ? "inactive" : "active";
    await db.complaintTable.update({ where: { id }, data: { status } });

    revalidateComplaintDashboard();
    return { success: true, status };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to update spot status." };
  }
}

export async function deleteComplaintTable(id: string) {
  try {
    const session = await requireOwner();
    const businessId = getSessionBusinessId(session);

    // Complaints keep their tableName snapshot; FK is SetNull so history survives.
    await db.complaintTable.delete({ where: { id, businessId } });

    revalidateComplaintDashboard();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to delete spot." };
  }
}

// ------------------------------------------------------------ QR codes ---

export async function createComplaintQr(formData: FormData) {
  try {
    const session = await requireOwner();
    const businessId = getSessionBusinessId(session);

    const parsed = parseValidated(complaintQrSchema, {
      tableId: formData.get("tableId"),
      label: formData.get("label"),
      status: formData.get("status") || "active",
    });
    if (!parsed.success) return { success: false, error: "Invalid QR details." };

    let tableId: string | null = parsed.data.tableId || null;
    if (tableId) {
      const table = await db.complaintTable.findFirst({ where: { id: tableId, businessId } });
      if (!table) return { success: false, error: "Selected spot not found." };
    }

    const qr = await db.complaintQr.create({
      data: {
        businessId,
        tableId,
        label: parsed.data.label || null,
        status: parsed.data.status,
        // token auto-generated (cuid); URL below stays valid across settings changes
      },
    });

    revalidateComplaintDashboard();
    return { success: true, qrId: qr.id, url: buildComplaintUrl(qr.token) };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to create Complaint QR." };
  }
}

export async function updateComplaintQr(id: string, formData: FormData) {
  try {
    const session = await requireOwner();
    const businessId = getSessionBusinessId(session);

    const parsed = parseValidated(complaintQrSchema, {
      tableId: formData.get("tableId"),
      label: formData.get("label"),
      status: formData.get("status") || "active",
    });
    if (!parsed.success) return { success: false, error: "Invalid QR details." };

    let tableId: string | null = parsed.data.tableId || null;
    if (tableId) {
      const table = await db.complaintTable.findFirst({ where: { id: tableId, businessId } });
      if (!table) return { success: false, error: "Selected spot not found." };
    }

    // NOTE: token is never changed, so printed QRs keep working.
    await db.complaintQr.update({
      where: { id, businessId },
      data: {
        tableId,
        label: parsed.data.label || null,
        status: parsed.data.status,
      },
    });

    revalidateComplaintDashboard();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to update Complaint QR." };
  }
}

export async function toggleComplaintQrStatus(id: string) {
  try {
    const session = await requireOwner();
    const businessId = getSessionBusinessId(session);

    const qr = await db.complaintQr.findFirst({ where: { id, businessId } });
    if (!qr) return { success: false, error: "QR not found." };

    const status = qr.status === "active" ? "disabled" : "active";
    await db.complaintQr.update({ where: { id }, data: { status } });

    revalidateComplaintDashboard();
    return { success: true, status };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to update QR status." };
  }
}

export async function deleteComplaintQr(id: string) {
  try {
    const session = await requireOwner();
    const businessId = getSessionBusinessId(session);

    // Complaints keep snapshots; FK is SetNull so history survives.
    await db.complaintQr.delete({ where: { id, businessId } });

    revalidateComplaintDashboard();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to delete QR." };
  }
}

// ------------------------------------------------------------ Categories ---

export async function createComplaintCategory(formData: FormData) {
  try {
    const session = await requireOwner();
    const businessId = getSessionBusinessId(session);

    const parsed = parseValidated(complaintCategorySchema, {
      label: formData.get("label"),
      isActive: formData.get("isActive") !== "false",
    });
    if (!parsed.success || !parsed.data.label) {
      return { success: false, error: "Option label is required." };
    }

    const maxOrder = await db.complaintCategory.findFirst({
      where: { businessId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const category = await db.complaintCategory.create({
      data: {
        businessId,
        label: parsed.data.label,
        sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
        isActive: parsed.data.isActive,
      },
    });

    revalidateComplaintDashboard();
    return { success: true, categoryId: category.id };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to add option." };
  }
}

export async function updateComplaintCategory(id: string, formData: FormData) {
  try {
    const session = await requireOwner();
    const businessId = getSessionBusinessId(session);

    const parsed = parseValidated(complaintCategorySchema, {
      label: formData.get("label"),
      isActive: formData.get("isActive") !== "false",
    });
    if (!parsed.success || !parsed.data.label) {
      return { success: false, error: "Option label is required." };
    }

    await db.complaintCategory.update({
      where: { id, businessId },
      data: { label: parsed.data.label, isActive: parsed.data.isActive },
    });

    revalidateComplaintDashboard();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to update option." };
  }
}

export async function toggleComplaintCategory(id: string) {
  try {
    const session = await requireOwner();
    const businessId = getSessionBusinessId(session);

    const category = await db.complaintCategory.findFirst({ where: { id, businessId } });
    if (!category) return { success: false, error: "Option not found." };

    await db.complaintCategory.update({ where: { id }, data: { isActive: !category.isActive } });

    revalidateComplaintDashboard();
    return { success: true, isActive: !category.isActive };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to update option." };
  }
}

export async function moveComplaintCategory(id: string, direction: "up" | "down") {
  try {
    const session = await requireOwner();
    const businessId = getSessionBusinessId(session);

    const ordered = await db.complaintCategory.findMany({
      where: { businessId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    const index = ordered.findIndex((c) => c.id === id);
    if (index === -1) return { success: false, error: "Option not found." };

    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= ordered.length) return { success: true };

    const [a, b] = [ordered[index], ordered[swapIndex]];
    await db.$transaction([
      db.complaintCategory.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
      db.complaintCategory.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
    ]);

    revalidateComplaintDashboard();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to reorder options." };
  }
}

export async function deleteComplaintCategory(id: string) {
  try {
    const session = await requireOwner();
    const businessId = getSessionBusinessId(session);

    // Complaints keep their categoryLabel snapshot; FK is SetNull.
    await db.complaintCategory.delete({ where: { id, businessId } });

    revalidateComplaintDashboard();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to delete option." };
  }
}

// ------------------------------------------------------------ Page settings ---

export async function updateComplaintSettings(formData: FormData) {
  try {
    const session = await requireOwner();
    const businessId = getSessionBusinessId(session);

    const parsed = parseValidated(complaintSettingsSchema, {
      heading: formData.get("heading"),
      description: formData.get("description"),
      allowDescription: formData.get("allowDescription") !== "false",
    });
    if (!parsed.success) return { success: false, error: "Invalid settings." };

    await db.complaintSettings.upsert({
      where: { businessId },
      update: {
        heading: parsed.data.heading || null,
        description: parsed.data.description || null,
        allowDescription: parsed.data.allowDescription,
      },
      create: {
        businessId,
        heading: parsed.data.heading || null,
        description: parsed.data.description || null,
        allowDescription: parsed.data.allowDescription,
      },
    });

    revalidateComplaintDashboard();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to save settings." };
  }
}

// ------------------------------------------------------------ Complaint handling (owner) ---

export async function updateComplaintStatus(complaintId: string, status: string) {
  try {
    const session = await requireOwner();
    const businessId = getSessionBusinessId(session);

    const parsed = complaintStatusSchema.safeParse(status);
    if (!parsed.success) return { success: false, error: "Invalid status." };
    if (!COMPLAINT_STATUSES.includes(parsed.data)) return { success: false, error: "Invalid status." };

    await db.complaint.update({
      where: { id: complaintId, businessId },
      data: { status: parsed.data },
    });

    revalidateComplaintDashboard();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to update status." };
  }
}

export async function addComplaintNote(formData: FormData) {
  try {
    const session = await requireOwner();
    const businessId = getSessionBusinessId(session);

    const parsed = parseValidated(complaintNoteSchema, {
      complaintId: formData.get("complaintId"),
      note: formData.get("note"),
      authorName: formData.get("authorName"),
    });
    if (!parsed.success) return { success: false, error: "Note text is required." };

    const complaint = await db.complaint.findFirst({
      where: { id: parsed.data.complaintId, businessId },
    });
    if (!complaint) return { success: false, error: "Complaint not found." };

    await db.complaintNote.create({
      data: {
        businessId,
        complaintId: complaint.id,
        note: parsed.data.note,
        authorName: parsed.data.authorName || (session.user as any)?.name || null,
      },
    });

    revalidateComplaintDashboard();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to add note." };
  }
}

export async function deleteComplaintNote(noteId: string) {
  try {
    const session = await requireOwner();
    const businessId = getSessionBusinessId(session);

    await db.complaintNote.delete({ where: { id: noteId, businessId } });

    revalidateComplaintDashboard();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to delete note." };
  }
}

// ------------------------------------------------------------ Public submission (no login) ---

export async function submitComplaint(data: {
  token: string;
  categoryIds: string[];
  description?: string;
  customerName?: string;
}) {
  const parsed = parseValidated(complaintSubmitSchema, data);
  if (!parsed.success) throw new Error("Please select at least one complaint option.");

  const resolution = await resolveComplaintQr(parsed.data.token);
  if (!resolution.ok) {
    if (resolution.reason === "disabled") throw new Error("This QR code is currently unavailable.");
    throw new Error("This complaint link is invalid.");
  }

  const uniqueIds = [...new Set(parsed.data.categoryIds)];
  const categories = await db.complaintCategory.findMany({
    where: { id: { in: uniqueIds }, businessId: resolution.business.id, isActive: true },
  });
  if (categories.length === 0) throw new Error("Please select a valid complaint option.");
  // Preserve the owner's configured order in snapshots
  categories.sort((a, b) => a.sortOrder - b.sortOrder);

  const complaint = await db.complaint.create({
    data: {
      businessId: resolution.business.id,
      tableId: resolution.qr.tableId,
      tableName: resolution.table?.name || null,
      qrId: resolution.qr.id,
      categoryId: categories[0].id,
      categoryLabel: categories.map((c) => c.label).join(", "),
      description: parsed.data.description || null,
      customerName: parsed.data.customerName || null,
      status: "new",
      selections: {
        create: categories.map((c) => ({ categoryId: c.id })),
      },
    },
  });

  revalidatePath("/dashboard/complaints-and-feedback");
  revalidatePath("/dashboard");

  return { success: true, complaintId: complaint.id };
}
