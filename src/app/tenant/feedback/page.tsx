"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTenantBase } from "@/lib/use-tenant-base";
import { submitPrivateFeedback } from "@/actions/feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/shared/star-rating";
import { toast } from "sonner";
import { MessageSquare, ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PrivateFeedbackPage() {
  const router = useRouter();
  const tenantBase = useTenantBase();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    rating: 5,
    liked: "",
    improve: "",
    comments: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.rating) {
      toast.error("Please provide an overall rating");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitPrivateFeedback(formData);
      toast.success("Feedback submitted privately to management");
      router.push(`${tenantBase}/thank-you`);
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 space-y-5 py-2">
      {/* Header */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center justify-center p-2.5 bg-slate-100 text-slate-700 rounded-2xl mb-1">
          <MessageSquare className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Private Feedback</h1>
        <p className="text-xs text-slate-500">
          Your feedback is sent directly to management and is strictly confidential.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 flex-1">
        {/* Rating */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 text-center space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Overall Experience Rating *
          </label>
          <StarRating
            value={formData.rating}
            onChange={(v) => setFormData((prev) => ({ ...prev, rating: v }))}
            size="lg"
          />
        </div>

        {/* What went well */}
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
            What did you like? (Optional)
          </label>
          <Textarea
            value={formData.liked}
            onChange={(e) => setFormData((prev) => ({ ...prev, liked: e.target.value }))}
            placeholder="Tell us what went well..."
            rows={2}
            className="rounded-xl text-sm bg-slate-50 border-slate-200"
          />
        </div>

        {/* What could improve */}
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
            What could we improve? (Optional)
          </label>
          <Textarea
            value={formData.improve}
            onChange={(e) => setFormData((prev) => ({ ...prev, improve: e.target.value }))}
            placeholder="Let us know how we can do better..."
            rows={2}
            className="rounded-xl text-sm bg-slate-50 border-slate-200"
          />
        </div>

        {/* Name and Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Name (Optional)</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Your name"
              className="rounded-xl text-sm bg-slate-50 border-slate-200"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Email / Phone (Optional)</label>
            <Input
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="For management follow-up"
              className="rounded-xl text-sm bg-slate-50 border-slate-200"
            />
          </div>
        </div>

        <div className="pt-2 space-y-2">
          <Button
            type="submit"
            size="lg"
            className="w-full rounded-2xl h-14 text-base font-bold bg-slate-800 hover:bg-slate-900 text-white shadow-md"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Send Private Feedback"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full text-xs text-slate-500"
            asChild
          >
            <Link href={tenantBase || "/tenant"}>
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Business Home
            </Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
