export default function TenantLoading() {
  return (
    <div className="flex flex-col items-center flex-1 py-2 animate-pulse" aria-label="Loading">
      <div className="h-20 w-20 rounded-2xl bg-slate-200" />
      <div className="mt-3 h-7 w-48 rounded-xl bg-slate-200" />
      <div className="mt-2 h-4 w-64 max-w-full rounded-lg bg-slate-100" />
      <div className="mt-6 w-full space-y-3.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 w-full rounded-2xl bg-slate-100 border border-slate-200/60" />
        ))}
      </div>
    </div>
  );
}
