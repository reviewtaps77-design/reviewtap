"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTenantBase } from "@/lib/use-tenant-base";
import { StarRating } from "@/components/shared/star-rating";
import { submitEmployeeRating } from "@/actions/rating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function EmployeeLandingPage() {
  const params = useParams();
  const router = useRouter();
  const tenantBase = useTenantBase();
  const employeeSlug = params.slug as string;

  const [ratings, setRatings] = useState({
    behaviour: 0,
    fastness: 0,
    overall: 0,
  });
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!ratings.behaviour || !ratings.fastness || !ratings.overall) {
      toast.error("Please provide all ratings");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitEmployeeRating({
        employeeSlug,
        ratings,
        comment,
      });
      // Navigate to the main tenant page to choose the next step (Google Review, etc)
      router.push(tenantBase || "/tenant");
    } catch (error) {
      toast.error("Failed to submit rating");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 space-y-6 py-4">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Rate Your Service</h1>
        <p className="text-gray-500">How did we do today?</p>
      </div>

      <div className="space-y-6 flex-1">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Behaviour</label>
          <StarRating
            rating={ratings.behaviour}
            onRatingChange={(v) => setRatings((prev) => ({ ...prev, behaviour: v }))}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Fastness</label>
          <StarRating
            rating={ratings.fastness}
            onRatingChange={(v) => setRatings((prev) => ({ ...prev, fastness: v }))}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Overall Experience</label>
          <StarRating
            rating={ratings.overall}
            onRatingChange={(v) => setRatings((prev) => ({ ...prev, overall: v }))}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Additional Comments (Optional)</label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us more about your experience..."
            className="resize-none"
            rows={4}
          />
        </div>
      </div>

      <Button
        size="lg"
        className="w-full rounded-xl h-14 text-lg"
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Saving..." : "Continue"}
      </Button>
    </div>
  );
}
