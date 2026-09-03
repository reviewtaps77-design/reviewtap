import { headers } from "next/headers";
import { db } from "@/lib/db";

export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const slug = headersList.get("x-business-slug");

  let business = null;
  if (slug) {
    business = await db.business.findUnique({
      where: { slug },
      include: {
        subscriptions: {
          where: { status: "active" },
          take: 1,
        },
      },
    });
  }

  const brandColor = business?.brandColor || "#2563eb";
  const isExpired = business && business.status === "expired";
  const isSuspended = business && business.status === "suspended";

  return (
    <div
      className="min-h-screen bg-slate-100 flex flex-col justify-between bg-cover bg-center"
      style={{
        "--tenant-brand": brandColor,
        ...(business?.coverUrl ? { backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.38), rgba(15, 23, 42, 0.38)), url(${business.coverUrl})` } : {}),
      } as React.CSSProperties}
    >
      <main
        className="flex-1 w-full max-w-md mx-auto bg-white/95 shadow-xl sm:my-6 sm:rounded-3xl sm:border sm:border-slate-200/80 flex flex-col relative overflow-hidden bg-cover bg-center"
        style={business?.coverUrl ? {
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.94)), url(${business.coverUrl})`,
        } : undefined}
      >
        {/* Top Accent Bar */}
        <div
          className="h-2 w-full"
          style={{ backgroundColor: brandColor }}
        />

        <div className="flex-1 p-6 flex flex-col">
          {isSuspended ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-2xl font-bold">
                !
              </div>
              <h2 className="text-xl font-bold text-gray-900">Service Temporarily Unavailable</h2>
              <p className="text-sm text-gray-500 max-w-xs">
                This business account is currently inactive. Please check back later.
              </p>
            </div>
          ) : isExpired ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-2xl font-bold">
                ✕
              </div>
              <h2 className="text-xl font-bold text-gray-900">Subscription Expired</h2>
              <p className="text-sm text-gray-500 max-w-xs">
                This business review portal is currently expired. Please contact the administrator.
              </p>
            </div>
          ) : (
            children
          )}
        </div>

        <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-100 bg-slate-50/50">
          Powered by <span className="font-semibold text-slate-600">ReviewTap</span>
        </footer>
      </main>
    </div>
  );
}
