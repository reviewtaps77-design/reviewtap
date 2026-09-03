import { headers } from "next/headers";
import { db } from "@/lib/db";
import Link from "next/link";
import { Star, Sparkles, MessageSquare, ExternalLink, MapPin } from "lucide-react";

export default async function TenantLandingPage() {
  const headersList = await headers();
  const slug = headersList.get("x-business-slug");
  const tenantBase = headersList.get("x-tenant-base") || "";
  const employeeSlug = headersList.get("x-employee-slug");

  if (!slug) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-bold text-gray-900">Welcome to ReviewTap</h2>
        <p className="text-sm text-gray-500 mt-2">Please scan a valid business or staff QR code.</p>
      </div>
    );
  }

  const business = await db.business.findUnique({
    where: { slug },
  });

  if (!business) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-bold text-gray-900">Business Not Found</h2>
        <p className="text-sm text-gray-500 mt-2">The requested business page does not exist.</p>
      </div>
    );
  }

  const employee = employeeSlug
    ? await db.employee.findUnique({ where: { businessId_slug: { businessId: business.id, slug: employeeSlug } } })
    : null;

  const brandColor = business.brandColor || "#2563eb";

  return (
    <div className="flex flex-col items-center justify-between flex-1 space-y-6 py-2">
      {/* Business Header */}
      <div className="text-center space-y-3 w-full">
        {business.logoUrl || business.coverUrl ? (
          <img
            src={business.logoUrl || business.coverUrl || ""}
            alt={`${business.name} logo`}
            className="w-20 h-20 mx-auto rounded-2xl object-cover shadow-md border border-slate-100"
          />
        ) : (
          <div
            className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md"
            style={{ backgroundColor: brandColor }}
          >
            {business.name.slice(0, 2).toUpperCase()}
          </div>
        )}

        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            {business.name}
          </h1>
          {business.category && (
            <p className="text-xs uppercase tracking-wider font-semibold text-slate-400 mt-0.5">
              {business.category}
            </p>
          )}
          {business.address && (
            <p className="text-xs text-slate-500 flex items-center justify-center gap-1 mt-1">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate max-w-[260px]">{business.address}</span>
            </p>
          )}
          {employee && (
            <p className="text-sm font-semibold text-slate-600 mt-2">Serving you today: {employee.name}</p>
          )}
        </div>

        <div className="pt-2">
          <p className="text-base font-medium text-slate-700">
            How was your experience with us?
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Your feedback takes less than 30 seconds
          </p>
        </div>
      </div>

      {/* 3 CTAs */}
      <div className="w-full space-y-3.5 my-auto">
        {/* CTA 1: Direct Google Review */}
        <a
          href={business.googleReviewUrl || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center p-4 w-full rounded-2xl text-white shadow-md transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
          style={{ backgroundColor: brandColor }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 mr-4 shrink-0">
            <Star className="w-6 h-6 fill-amber-300 text-amber-300" />
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-1.5 font-bold text-base">
              <span>Write a Google Review</span>
              <ExternalLink className="w-4 h-4 opacity-70 group-hover:opacity-100" />
            </div>
            <span className="block text-xs text-white/85">
              Direct 5-star review on Google Maps
            </span>
          </div>
        </a>

        {/* CTA 2: AI Review Assistant */}
        <Link
          href={`${tenantBase}/ai-review${employeeSlug ? `?employee=${encodeURIComponent(employeeSlug)}` : ""}`}
          className="group relative flex items-center p-4 w-full rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 mr-4 shrink-0">
            <Sparkles className="w-6 h-6 text-purple-200 animate-pulse" />
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-1.5 font-bold text-base">
              <span>AI Review Assistant</span>
              <span className="text-[10px] uppercase font-extrabold bg-white/25 px-1.5 py-0.5 rounded-full">
                Fast & Easy
              </span>
            </div>
            <span className="block text-xs text-purple-100">
              Answer 3 quick taps & AI writes your review
            </span>
          </div>
        </Link>

        {/* CTA 3: Private Feedback */}
        <Link
          href={`${tenantBase}/feedback${employeeSlug ? `?employee=${encodeURIComponent(employeeSlug)}` : ""}`}
          className="group flex items-center p-4 w-full bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-2xl transition-all duration-200 border border-slate-200/80 shadow-sm active:scale-[0.98]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200/80 mr-4 text-slate-600 shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div className="flex-1 text-left">
            <span className="block font-bold text-base text-slate-800">
              Private Feedback
            </span>
            <span className="block text-xs text-slate-500">
              Send suggestions directly to management
            </span>
          </div>
        </Link>
      </div>

      {business.description && (
        <p className="text-xs text-center text-slate-400 italic max-w-xs px-2">
          &ldquo;{business.description}&rdquo;
        </p>
      )}
    </div>
  );
}
