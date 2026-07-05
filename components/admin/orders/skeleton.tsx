export function OrderSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="h-11 w-[200px] rounded-3xl bg-slate-200" />
        <div className="h-11 w-[150px] rounded-3xl bg-slate-200" />
        <div className="h-11 w-[150px] rounded-3xl bg-slate-200" />
        <div className="h-11 w-[130px] rounded-3xl bg-slate-200" />
      </div>
      <div className="hidden overflow-hidden rounded-3xl bg-white shadow-sm shadow-slate-200 md:block">
        <div className="animate-pulse space-y-4 p-5">
          <div className="h-4 w-full rounded bg-slate-200" />
          <div className="h-4 w-full rounded bg-slate-100" />
          <div className="h-4 w-full rounded bg-slate-100" />
          <div className="h-4 w-full rounded bg-slate-100" />
          <div className="h-4 w-full rounded bg-slate-100" />
          <div className="h-4 w-3/4 rounded bg-slate-100" />
        </div>
      </div>
      <div className="animate-pulse space-y-3 md:hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="space-y-3 rounded-3xl bg-white p-5 shadow-sm shadow-slate-200"
          >
            <div className="h-4 w-1/2 rounded bg-slate-200" />
            <div className="h-4 w-3/4 rounded bg-slate-100" />
            <div className="h-4 w-1/3 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
