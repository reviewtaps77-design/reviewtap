"use server";

import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";
import { rateLimit, sanitizeEmail } from "@/lib/security";
import { resetRequestSchema } from "@/lib/validation";

export async function requestPasswordReset(email: string) {
  try {
    const parsed = resetRequestSchema.safeParse({ email });
    if (!parsed.success) {
      return { success: true };
    }

    const normalizedEmail = parsed.data.email;

    if (!rateLimit(`reset:${normalizedEmail}`, 3, 60 * 60 * 1000)) {
      return { success: true };
    }

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Don't leak user existence
      return { success: true };
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600 * 1000); // 1 hour

    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "reviewtap.in";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://reviewtap.in";
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    try {
      await sendPasswordResetEmail({
        to: user.email,
        resetUrl,
      });
    } catch (e) {
      console.warn("Could not send password reset email:", e);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Password reset error:", error);
    return { success: false, error: "Failed to process password reset request." };
  }
}
