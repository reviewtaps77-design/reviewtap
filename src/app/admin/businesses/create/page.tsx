"use client";

import { useActionState } from "react";
import { createBusinessAndOwner } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";

export default function CreateBusinessPage() {
  const [state, action, isPending] = useActionState(createBusinessAndOwner, null);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" asChild className="rounded-xl h-10 w-10">
          <Link href="/admin/businesses">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Add New Business Tenant</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Provision a new business account, owner credentials, and assigned subscription tier.
          </p>
        </div>
      </div>

      <Card className="rounded-3xl border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900">Tenant Registration</CardTitle>
          <CardDescription className="text-xs">
            Subdomain and business credentials will be emailed to the owner automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form action={action} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="businessName" className="text-xs font-semibold text-slate-700">
                  Business Name *
                </Label>
                <Input
                  id="businessName"
                  name="businessName"
                  required
                  placeholder="Café Delight"
                  className="rounded-xl"
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="slug" className="text-xs font-semibold text-slate-700">
                  Subdomain Slug * (Lowercase & Hyphens)
                </Label>
                <Input
                  id="slug"
                  name="slug"
                  required
                  placeholder="cafe-delight"
                  className="rounded-xl font-mono text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="plan" className="text-xs font-semibold text-slate-700">
                  Subscription Tier *
                </Label>
                <Select name="plan" defaultValue="monthly">
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly Plan (₹1,500)</SelectItem>
                    <SelectItem value="6month">6-Month Plan (₹7,000)</SelectItem>
                    <SelectItem value="12month">12-Month Plan (₹11,000 - Best Value)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ownerName" className="text-xs font-semibold text-slate-700">
                  Owner Full Name *
                </Label>
                <Input
                  id="ownerName"
                  name="ownerName"
                  required
                  placeholder="Rahul Sharma"
                  className="rounded-xl"
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="ownerEmail" className="text-xs font-semibold text-slate-700">
                  Owner Email Address *
                </Label>
                <Input
                  id="ownerEmail"
                  name="ownerEmail"
                  type="email"
                  required
                  placeholder="rahul@cafedelight.com"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ownerPhone" className="text-xs font-semibold text-slate-700">
                  Owner Phone (Optional)
                </Label>
                <Input
                  id="ownerPhone"
                  name="ownerPhone"
                  placeholder="+91 98765 43210"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                  Initial Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  defaultValue="ReviewTap@123"
                  className="rounded-xl font-mono text-sm"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="googleReviewUrl" className="text-xs font-semibold text-slate-700">
                  Google Review URL (Optional)
                </Label>
                <Input
                  id="googleReviewUrl"
                  name="googleReviewUrl"
                  placeholder="https://g.page/r/your-business/review"
                  className="rounded-xl"
                />
              </div>
            </div>

            {state?.error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {state.error}
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <Button type="button" variant="outline" asChild className="rounded-xl">
                <Link href="/admin/businesses">Cancel</Link>
              </Button>
              <Button type="submit" className="rounded-xl font-bold px-6" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Provisioning...
                  </>
                ) : (
                  "Create Business & Owner"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
