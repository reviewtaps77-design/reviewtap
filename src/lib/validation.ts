import { z } from "zod";

const normalizeString = (value: unknown): string | null | undefined => {
  if (typeof value !== "string") return value === null || value === undefined ? value : undefined;
  return value.replace(/\u0000/g, "").replace(/\s+/g, " ").trim();
};

export const emailSchema = z
  .string()
  .transform((value) => normalizeString(value) ?? "")
  .pipe(z.string().email().max(254));

export const slugSchema = z
  .string()
  .transform((value) => normalizeString(value)?.toLowerCase() ?? "")
  .pipe(z.string().regex(/^[a-z0-9-]+$/).min(3).max(60));

export const textSchema = (maxLength = 200) =>
  z
    .string()
    .transform((value) => normalizeString(value) || "")
    .pipe(z.string().max(maxLength).optional().nullable());

export const urlSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (typeof value !== "string") return null;
    const normalized = normalizeString(value);
    return normalized && normalized.length > 0 ? normalized : null;
  })
  .pipe(z.string().url().max(2048).nullable().optional());

export const phoneSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (typeof value !== "string") return null;
    const normalized = normalizeString(value);
    return normalized && normalized.length > 0 ? normalized : null;
  })
  .pipe(z.string().regex(/^\+?[\d()\s-]{8,20}$/).nullable().optional());

export const businessCreateSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  slug: slugSchema,
  ownerName: z.string().trim().min(2).max(120),
  ownerEmail: emailSchema,
  ownerPhone: phoneSchema.optional().nullable(),
  googleReviewUrl: urlSchema.optional().nullable(),
  plan: z.enum(["monthly", "6month", "12month", "6-month", "12-month"]).default("monthly"),
  password: z.string().min(8).max(128).optional().default("ReviewTap@123"),
});

export const businessProfileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: phoneSchema.optional().nullable(),
  website: urlSchema.optional().nullable(),
  address: z.string().trim().max(300).nullable().optional(),
  category: z.string().trim().max(80).nullable().optional(),
  description: z.string().trim().max(1200).nullable().optional(),
  googleReviewUrl: urlSchema.optional().nullable(),
  brandColor: z.string().regex(/^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/).default("#2563eb"),
  logoUrl: urlSchema.optional().nullable(),
  coverUrl: urlSchema.optional().nullable(),
});

export const employeeSchema = z.object({
  name: z.string().trim().min(2).max(120),
  employeeCode: z.string().trim().regex(/^[A-Za-z0-9 _-]+$/).max(40).nullable().optional(),
  role: z.string().trim().max(80).nullable().optional(),
  department: z.string().trim().max(80).nullable().optional(),
  profileImage: urlSchema.optional().nullable(),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const feedbackSchema = z.object({
  name: z.string().trim().max(120).nullable().optional(),
  email: z.string().trim().max(120).nullable().optional(),
  rating: z.number().int().min(1).max(5),
  liked: z.string().trim().max(200).nullable().optional(),
  improve: z.string().trim().max(400).nullable().optional(),
  comments: z.string().trim().max(1200).nullable().optional(),
  employeeSlug: z.string().trim().max(80).nullable().optional(),
  sessionToken: z.string().trim().max(255).nullable().optional(),
});

export const resetRequestSchema = z.object({
  email: emailSchema,
});

export function parseValidated<T>(
  schema: z.ZodType<T>,
  data: unknown
): z.SafeParseReturnType<unknown, T> {
  return schema.safeParse(data);
}
