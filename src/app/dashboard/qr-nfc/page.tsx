import { requireOwner, getSessionBusinessId } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, QrCode, Smartphone, Info, User } from "lucide-react";
import { generateQRCodeDataUrl, buildBusinessUrl, buildEmployeeUrl } from "@/lib/qr";
import Link from "next/link";

export const metadata = {
  title: "QR & NFC Management | ReviewTap",
};

export default async function QRNFCPage() {
  const session = await requireOwner();
  const businessId = getSessionBusinessId(session);

  const business = await db.business.findUnique({
    where: { id: businessId },
    include: {
      employees: {
        where: { status: "active" },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!business) return null;

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "reviewtap.in";
  const businessUrl = process.env.NODE_ENV === "production"
    ? `https://${business.slug}.${rootDomain}`
    : `http://localhost:3000?tenant=${business.slug}`;

  const businessQrDataUrl = await generateQRCodeDataUrl(businessUrl);

  const employeeQrList = await Promise.all(
    business.employees.map(async (emp) => {
      const empUrl = process.env.NODE_ENV === "production"
        ? `https://${business.slug}.${rootDomain}/staff/${emp.slug}`
        : `http://localhost:3000/staff/${emp.slug}?tenant=${business.slug}`;
      const qrDataUrl = await generateQRCodeDataUrl(empUrl);
      return {
        ...emp,
        empUrl,
        qrDataUrl,
      };
    })
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">QR & NFC Management</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Generate, download, and manage review codes for your store location and individual staff.
        </p>
      </div>

      {/* NFC Explanation Note (SRS Point 36) */}
      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200/80 text-xs text-blue-900 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed">
          <p className="font-bold text-sm">How NFC Review Cards Work:</p>
          <p>
            Your NFC card simply opens your unique business or staff URL when tapped against any modern smartphone. No custom apps or hardware installation required!
          </p>
        </div>
      </div>

      {/* Main Business QR Card */}
      <Card className="rounded-3xl border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-lg font-bold text-slate-900">Primary Business QR Code</CardTitle>
          <CardDescription className="text-xs">
            Directly routes customers to {business.name}&apos;s review hub. Ideal for table stands, counter tents, and receipts.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <img
              src={businessQrDataUrl}
              alt="Business QR Code"
              className="w-48 h-48 rounded-xl object-contain bg-white p-2 border shadow-sm"
            />
            <p className="text-xs font-mono text-slate-400 mt-2 truncate max-w-[200px]">
              {business.slug}.{rootDomain}
            </p>
          </div>

          <div className="md:col-span-2 space-y-4">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-sm">Public Portal URL</h3>
              <p className="text-xs font-mono text-slate-600 bg-slate-100 p-2.5 rounded-xl break-all">
                {businessUrl}
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-2">
              <a
                href={businessQrDataUrl}
                download={`${business.slug}-business-qr.png`}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 shadow-sm transition-colors"
              >
                <Download className="w-4 h-4" /> Download HD QR (PNG)
              </a>
              <a
                href={businessUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
              >
                <ExternalLink className="w-4 h-4" /> Preview Live
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee QR Codes Grid (FR-14.4) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Staff-Dedicated QR & NFC Codes</h3>
            <p className="text-xs text-slate-500">
              Each staff member has a dedicated URL to track customer ratings directly.
            </p>
          </div>
          <Button asChild size="sm" variant="outline" className="rounded-xl text-xs">
            <Link href="/dashboard/employees/add">Add Staff Member</Link>
          </Button>
        </div>

        {employeeQrList.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200/80 p-6 text-slate-500 text-xs space-y-2">
            <User className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-700">No staff members added yet</p>
            <p className="text-slate-400">Add employees to auto-generate personalized QR codes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {employeeQrList.map((emp) => (
              <Card key={emp.id} className="rounded-3xl border-slate-200/80 shadow-sm bg-white overflow-hidden p-4 flex flex-col justify-between space-y-4">
                <div className="flex items-start gap-3">
                  <img
                    src={emp.qrDataUrl}
                    alt={`${emp.name} QR`}
                    className="w-24 h-24 rounded-xl object-contain bg-white p-1.5 border shadow-inner shrink-0"
                  />
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-sm text-slate-900 truncate">{emp.name}</h4>
                    <p className="text-xs text-slate-500">{emp.role || "Staff"}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">Code: {emp.employeeCode || "—"}</p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <a
                    href={emp.qrDataUrl}
                    download={`${emp.slug}-qr-code.png`}
                    className="w-full inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download QR
                  </a>
                  <a
                    href={emp.empUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Test Staff URL
                  </a>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
