"use server";

import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";
import { hash } from "bcryptjs";
import { rateLimit, sanitizeEmail } from "@/lib/security";
import { resetRequestSchema, passwordResetSchema, parseValidated } from "@/lib/validation";

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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://reviewtap--reviewtap-235c2.asia-southeast1.hosted.app";
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

export async function resetPassword(input: { token: string; email: string; password: string }) {
  const parsed = parseValidated(passwordResetSchema, input);
  if (!parsed.success) {
    return { success: false, error: "Invalid reset details. Password must be 8–128 characters." };
  }

  try {
    const user = await db.user.findUnique({ where: { email: parsed.data.email } });
    if (
      !user ||
      !user.resetToken ||
      user.resetToken !== parsed.data.token ||
      !user.resetTokenExpiry ||
      user.resetTokenExpiry < new Date()
    ) {
      return { success: false, error: "This reset link is invalid or has expired. Please request a new one." };
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hash(parsed.data.password, 12),
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Password reset error:", error);
    return { success: false, error: "Failed to reset password. Please try again." };
  }
}
