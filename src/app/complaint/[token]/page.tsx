import { resolveComplaintQr } from "@/lib/complaint";
import ComplaintForm from "./complaint-form";

export default async function ComplaintPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const resolution = await resolveComplaintQr(token);

  if (!resolution.ok) {
    const message =
      resolution.reason === "disabled"
        ? { title: "QR Unavailable", body: "This QR code is currently unavailable. Please contact the staff for help." }
        : resolution.reason === "business_unavailable"
          ? { title: "Service Unavailable", body: "This business is currently not accepting complaints. Please try again later." }
          : { title: "Invalid Link", body: "This complaint link is invalid. Please scan the QR code at your table again." };

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 py-12 text-center">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
          <h1 className="text-xl font-extrabold text-gray-900">{message.title}</h1>
          <p className="mt-2 text-sm text-slate-500">{message.body}</p>
        </div>
      </div>
    );
  }

  const { business, table, settings, categories } = resolution;
  const brandColor = business.brandColor || "#2563eb";

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <div className="h-2 w-full" style={{ backgroundColor: brandColor }} />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col bg-white px-6 py-6 shadow-xl sm:my-6 sm:rounded-3xl">
        {/* Business branding */}
        <div className="text-center">
          {business.logoUrl ? (
            <img
              src={business.logoUrl}
              alt={`${business.name} logo`}
              className="mx-auto h-20 w-20 rounded-2xl border border-slate-100 object-cover shadow-md"
            />
          ) : (
            <div
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-md"
              style={{ backgroundColor: brandColor }}
            >
              {business.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-gray-900">{business.name}</h1>
          {table && (
            <p className="mt-1 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {table.branch ? `${table.branch} • ` : ""}{table.name}
            </p>
          )}
        </div>

        <div className="mt-6 text-center">
          <h2 className="text-lg font-bold text-gray-900">
            {settings?.heading || "What went wrong?"}
          </h2>
          {settings?.description && (
            <p className="mt-1 text-xs text-slate-500">{settings.description}</p>
          )}
        </div>

        <ComplaintForm
          token={token}
          categories={categories.map((c: any) => ({ id: c.id, label: c.label }))}
          allowDescription={settings?.allowDescription ?? true}
          brandColor={brandColor}
        />

        <footer className="pt-6 text-center text-[11px] text-slate-300">
          Powered by ReviewTap
        </footer>
      </main>
    </div>
  );
}
