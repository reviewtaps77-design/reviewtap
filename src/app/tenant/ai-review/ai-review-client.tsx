"use client";

import { useState } from "react";
import { generateAiReview, recordGoogleReviewClick } from "@/actions/review";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Sparkles, Copy, ExternalLink, ArrowLeft, Check, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTenantBase } from "@/lib/use-tenant-base";

export default function AiReviewClient({ quickLikes }: { quickLikes: string[] }) {
  const router = useRouter();
  const tenantBase = useTenantBase();
  const searchParams = useSearchParams();
  const employeeSlug = searchParams.get("employee") || undefined;

  const [step, setStep] = useState<"form" | "result">("form");
  const [formData, setFormData] = useState({
    liked: "",
    ordered: "",
    service: "",
    employeeInteraction: "",
    recommend: "Yes, definitely!",
  });
  const [generatedReview, setGeneratedReview] = useState("");
  const [reviewId, setReviewId] = useState<string | undefined>(undefined);
  const [googleReviewUrl, setGoogleReviewUrl] = useState<string>("#");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!formData.liked && !formData.ordered && !formData.service && !formData.employeeInteraction) {
      toast.error("Please select or type at least one detail about your visit");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await generateAiReview({
        liked: formData.liked,
        ordered: formData.ordered,
        service: formData.service,
        employeeInteraction: formData.employeeInteraction,
        recommend: formData.recommend,
        employeeSlug,
      });

      if (response.success) {
        setGeneratedReview(response.review);
        setReviewId(response.reviewId);
        setGoogleReviewUrl(response.googleReviewUrl || "#");
        setStep("result");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to generate review");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyAndGoToGoogle = async () => {
    setIsContinuing(true);
    try {
      await navigator.clipboard.writeText(generatedReview);
      setCopied(true);
      toast.success("Review copied! Paste it on Google.");

      await recordGoogleReviewClick({
        reviewId,
        editedText: generatedReview,
      });

      if (googleReviewUrl && googleReviewUrl !== "#") {
        window.open(googleReviewUrl, "_blank", "noopener,noreferrer");
      }

      setTimeout(() => {
        router.push(`${tenantBase}/thank-you`);
      }, 1200);
    } catch (err) {
      setIsContinuing(false);
      toast.error("Please copy the text manually and proceed to Google.");
    }
  };

  return (
    <div className="flex flex-col flex-1 space-y-5 py-2">
      {/* Header */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center justify-center p-2.5 bg-purple-50 text-purple-600 rounded-2xl mb-1">
          <Sparkles className="w-6 h-6 text-purple-600 animate-pulse" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">AI Review Assistant</h1>
        <p className="text-xs text-slate-500">
          {step === "form"
            ? "Answer 2-3 quick questions. AI will craft a natural review for you."
            : "Review and edit your text before copying to Google."}
        </p>
      </div>

      {step === "form" ? (
        <div className="space-y-4 flex-1">
          {/* Quick Like chips */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              What did you like most?
            </label>
            <div className="flex flex-wrap gap-1.5">
              {quickLikes.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, liked: p.liked ? `${p.liked}, ${item}` : item }))}
                  className="text-xs bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-700 px-2.5 py-1 rounded-full transition-colors font-medium border border-slate-200/60"
                >
                  + {item}
                </button>
              ))}
            </div>
            <Textarea
              value={formData.liked}
              onChange={(e) => setFormData((p) => ({ ...p, liked: e.target.value }))}
              placeholder="e.g. Delicious pasta, warm lighting, cozy seats..."
              rows={2}
              className="rounded-xl text-sm bg-slate-50 border-slate-200 mt-1"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              What did you order or try? (Optional)
            </label>
            <Textarea
              value={formData.ordered}
              onChange={(e) => setFormData((p) => ({ ...p, ordered: e.target.value }))}
              placeholder="e.g. Cold Brew Coffee, Margherita Pizza..."
              rows={2}
              className="rounded-xl text-sm bg-slate-50 border-slate-200"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              How was the staff service?
            </label>
            <Textarea
              value={formData.service}
              onChange={(e) => setFormData((p) => ({ ...p, service: e.target.value }))}
              placeholder="e.g. Very fast, polite and super attentive..."
              rows={2}
              className="rounded-xl text-sm bg-slate-50 border-slate-200"
            />
          </div>

          <Button
            size="lg"
            className="w-full rounded-2xl h-14 text-base font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md flex items-center justify-center gap-2"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            {isGenerating ? "Crafting your review..." : "Generate AI Review"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4 flex-1 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Your Editable Review
              </label>
              <span className="text-[11px] text-purple-600 font-medium">Tap text to edit</span>
            </div>
            <Textarea
              value={generatedReview}
              onChange={(e) => setGeneratedReview(e.target.value)}
              className="min-h-[180px] rounded-2xl text-sm bg-purple-50/40 border-purple-200 focus:border-purple-500 leading-relaxed p-4"
            />
          </div>

          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200/80 text-xs text-amber-800 flex items-start gap-2">
            <span className="font-bold shrink-0">Note:</span>
            <span>Google policy requires you to paste and submit the review on Google Maps.</span>
          </div>

          <div className="space-y-2.5 pt-2">
            <Button
              size="lg"
              className="w-full rounded-2xl h-14 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center justify-center gap-2"
              onClick={handleCopyAndGoToGoogle}
              disabled={isContinuing}
            >
              {isContinuing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : copied ? (
                <Check className="w-5 h-5 text-green-300" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
              {isContinuing ? "Opening Google..." : copied ? "Copied! Opening Google..." : "Copy & Continue to Google"}
              <ExternalLink className="w-4 h-4 ml-1 opacity-80" />
            </Button>

            <Button
              variant="outline"
              className="w-full rounded-2xl h-11 text-xs text-slate-600 border-slate-300"
              onClick={() => setStep("form")}
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Adjust Questions
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
