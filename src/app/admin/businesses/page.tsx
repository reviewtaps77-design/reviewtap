import Link from "next/link";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, ExternalLink, Building2, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toggleBusinessStatus, deleteBusiness } from "@/actions/admin";

export const metadata = {
  title: "Businesses Directory | Admin ReviewTap",
};

export default async function BusinessesPage() {
  const businesses = await db.business.findMany({
    include: {
      subscriptions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: {
        select: { employees: true, scans: true, reviews: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tenant Businesses</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Overview of all active and suspended client businesses on ReviewTap.
          </p>
        </div>
        <Link href="/admin/businesses/create">
          <Button className="gap-2 rounded-xl font-bold">
            <Plus className="h-4 w-4" />
            Add Business
          </Button>
        </Link>
      </div>

      <Card className="rounded-3xl border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900">Registered Businesses ({businesses.length})</CardTitle>
          <CardDescription className="text-xs">
            Manage client subscriptions, credentials, and subdomain portals.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/75">
              <TableRow>
                <TableHead className="font-bold text-slate-700">Business Name</TableHead>
                <TableHead className="font-bold text-slate-700">Subdomain / Slug</TableHead>
                <TableHead className="font-bold text-slate-700">Owner Contact</TableHead>
                <TableHead className="font-bold text-slate-700">Plan</TableHead>
                <TableHead className="font-bold text-slate-700">Staff Count</TableHead>
                <TableHead className="font-bold text-slate-700">Status</TableHead>
                <TableHead className="text-right font-bold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {businesses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-slate-500 text-xs">
                    No businesses created yet. Click &ldquo;Add Business&rdquo; to register your first tenant.
                  </TableCell>
                </TableRow>
              ) : (
                businesses.map((b) => {
                  const sub = b.subscriptions[0];
                  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
                  const publicUrl = `${appBaseUrl}/biz/${b.slug}`;

                  return (
                    <TableRow key={b.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: b.brandColor || "#2563eb" }}
                          >
                            {b.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span>{b.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <a
                          href={publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
                        >
                          {b.slug} <ExternalLink className="w-3 h-3" />
                        </a>
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-semibold text-slate-800 block">{b.ownerName}</span>
                        <span className="text-slate-400">{b.ownerEmail}</span>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-700 capitalize">
                        {sub ? sub.plan : "None"}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-700">
                        {b._count.employees} employees
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-[10px] font-bold border-0 uppercase ${
                            b.status === "active"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {b.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <form
                            action={async () => {
                              "use server";
                              await toggleBusinessStatus(b.id);
                            }}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              type="submit"
                              className="text-xs h-8 px-2"
                            >
                              {b.status === "active" ? "Suspend" : "Activate"}
                            </Button>
                          </form>
                          <form
                            action={async () => {
                              "use server";
                              await deleteBusiness(b.id);
                            }}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              type="submit"
                              className="text-xs h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              Delete
                            </Button>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
