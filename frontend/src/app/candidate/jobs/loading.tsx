export default function CandidateJobsLoading() {
  return (
    <div
      className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
      aria-label="Đang tải danh sách việc làm"
    >
      <div className="h-4 w-40 rounded bg-muted motion-safe:animate-pulse" />
      <div className="mt-4 h-10 w-full max-w-xl rounded-lg bg-muted motion-safe:animate-pulse" />
      <div className="mt-3 h-5 w-full max-w-2xl rounded bg-muted motion-safe:animate-pulse" />
      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="h-[520px] rounded-2xl border bg-surface p-5">
          <div className="h-full rounded-xl bg-muted motion-safe:animate-pulse" />
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-72 rounded-2xl border bg-surface p-5">
              <div className="h-full rounded-xl bg-muted motion-safe:animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
