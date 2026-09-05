export default function ComplaintLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <div className="h-2 w-full bg-slate-200" />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center bg-white px-6 py-6 shadow-xl sm:my-6 sm:rounded-3xl animate-pulse" aria-label="Loading complaint form">
        <div className="h-20 w-20 rounded-2xl bg-slate-200" />
        <div className="mt-3 h-7 w-44 rounded-xl bg-slate-200" />
        <div className="mt-4 h-6 w-56 max-w-full rounded-xl bg-slate-100" />
        <div className="mt-5 grid w-full grid-cols-2 gap-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 rounded-2xl bg-slate-100 border border-slate-200/60" />
          ))}
        </div>
        <div className="mt-4 h-24 w-full rounded-xl bg-slate-100" />
        <div className="mt-4 h-14 w-full rounded-2xl bg-slate-200" />
      </main>
    </div>
  );
}
