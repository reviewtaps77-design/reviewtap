export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Loading admin panel">
      <div className="space-y-2">
        <div className="h-7 w-56 rounded-xl bg-slate-200" />
        <div className="h-4 w-80 max-w-full rounded-lg bg-slate-100" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-white border border-slate-200/80" />
        ))}
      </div>
      <div className="h-64 rounded-3xl bg-white border border-slate-200/80" />
    </div>
  );
}
