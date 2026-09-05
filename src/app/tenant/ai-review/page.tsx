import { Suspense } from "react";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { DEFAULT_AI_PROMPT_OPTIONS, ensureAiPromptDefaults, getActiveAiPromptOptions } from "@/lib/ai-prompt";
import AiReviewClient from "./ai-review-client";

export default async function AiReviewPage() {
  const headersList = await headers();
  const businessSlug = headersList.get("x-business-slug");

  let quickLikes: string[] | null = null;
  if (businessSlug) {
    const business = await db.business.findUnique({
      where: { slug: businessSlug },
      select: { id: true },
    });
    if (business) {
      await ensureAiPromptDefaults(business.id);
      quickLikes = await getActiveAiPromptOptions(business.id);
    }
  }

  return (
    <Suspense fallback={<div className="text-center py-12">Loading AI Assistant...</div>}>
      <AiReviewClient quickLikes={quickLikes ?? DEFAULT_AI_PROMPT_OPTIONS} />
    </Suspense>
  );
}
