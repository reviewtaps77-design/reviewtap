import { CheckCircle2, Heart, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ThankYouPage() {
  return (
    <div className="flex flex-col items-center justify-between flex-1 py-8 text-center animate-in fade-in-50">
      <div className="my-auto space-y-4">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-sm border border-emerald-100">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-gray-900">Thank You!</h1>
          <p className="text-sm text-slate-600 max-w-xs mx-auto leading-relaxed">
            Your review and feedback make a huge difference in helping our local business grow and improve.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-500 bg-rose-50 px-3 py-1 rounded-full">
          <Heart className="w-3.5 h-3.5 fill-current" />
          We appreciate your support!
        </div>
      </div>

      <div className="w-full pt-4">
        <Button asChild variant="outline" className="w-full h-12 rounded-2xl border-slate-300 font-medium">
          <Link href="./">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
