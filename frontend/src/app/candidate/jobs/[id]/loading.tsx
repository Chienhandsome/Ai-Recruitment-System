export default function CandidateJobDetailLoading() {
  return (
    <div
      className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
      aria-label="Đang tải thông tin việc làm"
    >
      <div className="h-5 w-40 rounded bg-muted motion-safe:animate-pulse" />
      <div className="mt-5 h-44 rounded-2xl border bg-surface p-6">
        <div className="h-full rounded-xl bg-muted motion-safe:animate-pulse" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-48 rounded-2xl border bg-surface p-5">
              <div className="h-full rounded-xl bg-muted motion-safe:animate-pulse" />
            </div>
          ))}
        </div>
        <div className="h-96 rounded-2xl border bg-surface p-5">
          <div className="h-full rounded-xl bg-muted motion-safe:animate-pulse" />
        </div>
      </div>
    </div>
  );
}
