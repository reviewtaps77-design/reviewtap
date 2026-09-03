import { requireOwner, getSessionBusinessId } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateBusinessProfile } from "@/actions/business";
import { BusinessImageUpload } from "@/components/business-image-upload";
import { Building2, Info, Star, ExternalLink, Palette, MapPin, Globe, Phone } from "lucide-react";

export const metadata = {
  title: "Business Profile & Branding | ReviewTap",
};

export default async function ProfilePage() {
  const session = await requireOwner();
  const businessId = getSessionBusinessId(session);

  const business = await db.business.findUnique({
    where: { id: businessId },
  });

  if (!business) return null;

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Business Profile & Branding</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Customize your business identity, brand colors, Google review destination, and public details.
        </p>
      </div>

      {/* Google Review URL Guidance (Point 38) */}
      <div className="p-5 rounded-3xl bg-blue-50/70 border border-blue-200/80 space-y-2 text-xs text-blue-950">
        <div className="flex items-center gap-2 font-bold text-sm text-blue-900">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span>How to Get Your Google Review Link:</span>
        </div>
        <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1 leading-relaxed">
          <li>Search your business name on Google or open your Google Business Profile Manager.</li>
          <li>Click &ldquo;Ask for reviews&rdquo; or &ldquo;Share review form&rdquo;.</li>
          <li>Copy the direct short link (e.g. <code className="bg-white px-1.5 py-0.5 rounded border">https://g.page/r/.../review</code>) and paste it below.</li>
        </ol>
        <p className="text-[11px] text-slate-500 italic pt-1">
          *Note: Per Google policies, ReviewTap routes authenticated customers directly to your Google review modal so they can post authentic reviews.
        </p>
      </div>

      <Card className="rounded-3xl border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900">Store Profile Information</CardTitle>
          <CardDescription className="text-xs">
            This information is shown on your customer-facing review portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form
            action={async (formData: FormData) => {
              "use server";
              await updateBusinessProfile(formData);
            }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold text-slate-700">
                  Business Name *
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={business.name}
                  placeholder="Café Delight"
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-xs font-semibold text-slate-700">
                  Business Category
                </Label>
                <Input
                  id="category"
                  name="category"
                  defaultValue={business.category || ""}
                  placeholder="Café & Restaurant, Dental Clinic, Retail Store..."
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-semibold text-slate-700">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={business.phone || ""}
                  placeholder="+91 98765 43210"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="website" className="text-xs font-semibold text-slate-700">
                  Website URL
                </Label>
                <Input
                  id="website"
                  name="website"
                  defaultValue={business.website || ""}
                  placeholder="https://yourwebsite.com"
                  className="rounded-xl"
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="googleReviewUrl" className="text-xs font-semibold text-slate-700">
                  Google Review Direct URL *
                </Label>
                <Input
                  id="googleReviewUrl"
                  name="googleReviewUrl"
                  defaultValue={business.googleReviewUrl || ""}
                  placeholder="https://g.page/r/your-slug/review"
                  className="rounded-xl bg-blue-50/30 border-blue-200"
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="address" className="text-xs font-semibold text-slate-700">
                  Physical Address
                </Label>
                <Input
                  id="address"
                  name="address"
                  defaultValue={business.address || ""}
                  placeholder="123 MG Road, Bengaluru, Karnataka 560001"
                  className="rounded-xl"
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="description" className="text-xs font-semibold text-slate-700">
                  Business Description / Tagline
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={business.description || ""}
                  placeholder="A cozy café serving the finest artisan coffee and freshly baked pastries."
                  rows={2}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="brandColor" className="text-xs font-semibold text-slate-700">
                  Brand Color (Hex)
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="brandColor"
                    name="brandColor"
                    type="color"
                    defaultValue={business.brandColor || "#2563eb"}
                    className="w-16 h-11 p-1 rounded-xl cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-500">
                    Accent color used across customer pages
                  </span>
                </div>
              </div>

              <BusinessImageUpload
                businessId={business.id}
                logoUrl={business.logoUrl || ""}
                coverUrl={business.coverUrl || ""}
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button type="submit" size="lg" className="rounded-xl font-bold px-8 shadow-sm">
                Save Profile Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
