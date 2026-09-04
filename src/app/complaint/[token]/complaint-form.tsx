"use client";

import { useState } from "react";
import { submitComplaint } from "@/actions/complaint";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

interface ComplaintFormProps {
  token: string;
  categories: { id: string; label: string }[];
  allowDescription: boolean;
  brandColor: string;
}

export default function ComplaintForm({ token, categories, allowDescription, brandColor }: ComplaintFormProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleCategory = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one option");
      return;
    }
    setIsSubmitting(true);
    try {
      await submitComplaint({
        token,
        categoryIds: selectedIds,
        description: description.trim() || undefined,
        customerName: customerName.trim() || undefined,
      });
      setSubmitted(true);
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit complaint");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-500 shadow-sm">
          <CheckCircle2 className="h-12 w-12" />
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-gray-900">Thank you for letting us know.</h2>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-600">
          Your complaint has been shared privately with the management. We will look into it right away.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5 flex flex-1 flex-col space-y-4">
      <p className="-mb-1 text-center text-[11px] font-medium text-slate-400">
        Select all that apply{selectedIds.length > 0 ? ` (${selectedIds.length} selected)` : ""}
      </p>
      {categories.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-500">
          No complaint options are available right now. Please contact the staff directly.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2.5" role="group" aria-label="What went wrong? Select all that apply">
          {categories.map((category) => {
            const selected = selectedIds.includes(category.id);
            return (
              <button
                key={category.id}
                type="button"
                role="checkbox"
                aria-checked={selected}
                onClick={() => toggleCategory(category.id)}
                className={`rounded-2xl border px-3 py-3.5 text-sm font-semibold transition-all active:scale-[0.98] ${
                  selected
                    ? "border-transparent text-white shadow-md"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                }`}
                style={selected ? { backgroundColor: brandColor } : undefined}
              >
                {category.label}
              </button>
            );
          })}
        </div>
      )}

      {allowDescription && (
        <div className="space-y-1.5">
          <label htmlFor="complaint-description" className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Type your complaint (optional)
          </label>
          <Textarea
            id="complaint-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. The food took too long…"
            rows={3}
            className="rounded-xl border-slate-200 bg-slate-50 text-sm"
          />
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="complaint-name" className="text-xs font-medium text-slate-600">
          Your name (optional)
        </label>
        <Input
          id="complaint-name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="So we can follow up if needed"
          className="rounded-xl border-slate-200 bg-slate-50 text-sm"
        />
      </div>

      <Button
        size="lg"
        className="h-14 w-full rounded-2xl text-base font-bold text-white shadow-md"
        style={{ backgroundColor: brandColor }}
        onClick={handleSubmit}
        disabled={isSubmitting || categories.length === 0}
      >
        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        {isSubmitting ? "Submitting…" : "Submit Complaint"}
      </Button>
      <p className="text-center text-[11px] text-slate-400">
        Your complaint goes privately to the management only.
      </p>
    </div>
  );
}
