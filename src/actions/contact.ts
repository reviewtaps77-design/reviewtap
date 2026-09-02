"use server";

import { sendContactFormEmail } from "@/lib/email";
import { sanitizeEmail, sanitizePhone, sanitizeText } from "@/lib/security";

export type ContactFormState = {
  success?: boolean;
  error?: string;
};

export async function submitContactForm(
  _previousState: ContactFormState | null,
  formData: FormData,
): Promise<ContactFormState> {
  const name = sanitizeText(formData.get("name")?.toString(), 120);
  const businessName = sanitizeText(formData.get("businessName")?.toString(), 160);
  const email = sanitizeEmail(formData.get("email")?.toString());
  const phone = sanitizePhone(formData.get("phone")?.toString());
  const message = sanitizeText(formData.get("message")?.toString(), 2000);

  if (!name || !businessName || !email || !phone || !message) {
    return { error: "Please complete all fields with valid information." };
  }

  try {
    await sendContactFormEmail({ name, businessName, email, phone, message });
    return { success: true };
  } catch (error) {
    console.error("Failed to send contact form email", error);
    return { error: "We could not send your message. Please try again later." };
  }
}