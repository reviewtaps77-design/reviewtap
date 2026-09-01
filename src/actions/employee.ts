"use server";

import { requireOwner, getSessionBusinessId } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { generateSlug } from "@/lib/utils";
import { buildEmployeeUrl } from "@/lib/qr";
import { sanitizeAlphaNumeric, sanitizeText, sanitizeUrl } from "@/lib/security";
import { employeeSchema, parseValidated } from "@/lib/validation";

export async function createEmployee(formData: FormData) {
  try {
    const session = await requireOwner();
    const businessId = getSessionBusinessId(session);

    const parsedInput = parseValidated(employeeSchema, {
      name: formData.get("name"),
      employeeCode: formData.get("employeeCode"),
      role: formData.get("role"),
      department: formData.get("department"),
      profileImage: formData.get("profileImage"),
      status: formData.get("status") || "active",
    });

    if (!parsedInput.success) {
      return { success: false, error: "Invalid employee details." };
    }

    const { name, employeeCode, role, department, profileImage, status } = parsedInput.data;

    if (!name) {
      return { success: false, error: "Employee name is required" };
    }

    const business = await db.business.findUnique({ where: { id: businessId } });
    if (!business) return { success: false, error: "Business not found" };

    let baseSlug = generateSlug(name);
    if (!baseSlug) baseSlug = "staff";

    let slug = baseSlug;
    let counter = 1;

    while (
      await db.employee.findUnique({
        where: { businessId_slug: { businessId, slug } },
      })
    ) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const employee = await db.$transaction(async (tx) => {
      const newEmp = await tx.employee.create({
        data: {
          name,
          employeeCode,
          role,
          department,
          profileImage,
          status,
          slug,
          businessId,
        },
      });

      const empUrl = buildEmployeeUrl(business.slug, slug);

      await tx.qrCode.create({
        data: {
          businessId,
          employeeId: newEmp.id,
          type: "employee_qr",
          url: empUrl,
          status: "active",
        },
      });

      return newEmp;
    });

    revalidatePath("/dashboard/employees");
    revalidatePath("/dashboard/qr-nfc");
    revalidatePath("/dashboard");

    return { success: true, employeeId: employee.id };
  } catch (error: any) {
    console.error("Failed to create employee:", error);
    return { success: false, error: error?.message || "Failed to create employee" };
  }
}

export async function updateEmployee(id: string, formData: FormData) {
  try {
    const session = await requireOwner();
    const businessId = getSessionBusinessId(session);

    const parsedInput = parseValidated(employeeSchema, {
      name: formData.get("name"),
      employeeCode: formData.get("employeeCode"),
      role: formData.get("role"),
      department: formData.get("department"),
      profileImage: formData.get("profileImage"),
      status: formData.get("status") || "active",
    });

    if (!parsedInput.success) {
      return { success: false, error: "Invalid employee details." };
    }

    const { name, employeeCode, role, department, profileImage, status } = parsedInput.data;

    if (!name) {
      return { success: false, error: "Employee name is required" };
    }

    await db.employee.update({
      where: {
        id,
        businessId, // Tenant isolation check
      },
      data: {
        name,
        employeeCode,
        role,
        department,
        profileImage,
        status,
      },
    });

    revalidatePath("/dashboard/employees");
    revalidatePath(`/dashboard/employees/${id}`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to update employee:", error);
    return { success: false, error: error?.message || "Failed to update employee" };
  }
}

export async function toggleEmployeeStatus(id: string) {
  try {
    const session = await requireOwner();
    const businessId = getSessionBusinessId(session);

    const employee = await db.employee.findFirst({
      where: { id, businessId },
    });

    if (!employee) {
      return { success: false, error: "Employee not found." };
    }

    const newStatus = employee.status === "active" ? "inactive" : "active";

    await db.employee.update({
      where: { id },
      data: { status: newStatus },
    });

    revalidatePath("/dashboard/employees");
    revalidatePath(`/dashboard/employees/${id}`);
    return { success: true, status: newStatus };
  } catch (error: any) {
    console.error("Failed to toggle employee status:", error);
    return { success: false, error: error?.message || "Failed to toggle status" };
  }
}

export async function deleteEmployee(id: string) {
  try {
    const session = await requireOwner();
    const businessId = getSessionBusinessId(session);

    await db.employee.delete({
      where: {
        id,
        businessId, // Tenant isolation check
      },
    });

    revalidatePath("/dashboard/employees");
    revalidatePath("/dashboard/qr-nfc");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete employee:", error);
    return { success: false, error: error?.message || "Failed to delete employee" };
  }
}
