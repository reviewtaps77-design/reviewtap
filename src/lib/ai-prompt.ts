import { db } from "./db";

/** Default "what did you like" quick picks (used only when a business has none yet). */
export const DEFAULT_AI_PROMPT_OPTIONS = [
  "Delicious food & coffee",
  "Great ambiance",
  "Quick & polite service",
  "Affordable pricing",
  "Clean & cozy place",
];

/** Creates default quick picks for a business that has none yet. Idempotent. */
export async function ensureAiPromptDefaults(businessId: string) {
  const count = await db.aiPromptOption.count({ where: { businessId } });
  if (count === 0) {
    await db.aiPromptOption.createMany({
      data: DEFAULT_AI_PROMPT_OPTIONS.map((label, index) => ({
        businessId,
        label,
        sortOrder: index,
        isActive: true,
      })),
    });
  }
}

/** Active quick picks in owner-defined order (public, customer-facing). */
export async function getActiveAiPromptOptions(businessId: string): Promise<string[]> {
  const options = await db.aiPromptOption.findMany({
    where: { businessId, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { label: true },
  });
  return options.length > 0 ? options.map((o) => o.label) : [...DEFAULT_AI_PROMPT_OPTIONS];
}
