import { NextResponse } from "next/server";
import { requireOwner, getSessionBusinessId } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { sanitizeUrl } from "@/lib/security";

export async function POST(request: Request) {
  try {
    const session = await requireOwner();
    const businessId = getSessionBusinessId(session);
    const body = await request.json();
    const kind = body?.kind;
    const url = sanitizeUrl(body?.url);

    if ((kind !== "logo" && kind !== "cover") || !url) {
      return NextResponse.json({ success: false, error: "Invalid uploaded image." }, { status: 400 });
    }

    await db.business.update({
      where: { id: businessId },
      data: kind === "logo" ? { logoUrl: url } : { coverUrl: url },
    });

    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard");
    revalidatePath("/tenant");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save business image:", error);
    return NextResponse.json({ success: false, error: "The image uploaded, but could not be saved." }, { status: 500 });
  }
}