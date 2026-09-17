export default function CandidateHomeLoading() {
  return (
    <div aria-label="Đang tải danh sách việc làm" className="pb-14">
      <div className="border-b border-blue-100 bg-blue-50/60">
        <div className="mx-auto grid w-full max-w-[1480px] gap-8 px-4 py-9 sm:px-6 sm:py-11 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
          <div>
            <div className="h-4 w-44 rounded bg-blue-100 motion-safe:animate-pulse" />
            <div className="mt-4 h-12 w-full max-w-2xl rounded-xl bg-blue-100 motion-safe:animate-pulse" />
            <div className="mt-4 h-5 w-full max-w-xl rounded bg-blue-100/80 motion-safe:animate-pulse" />
          </div>
          <div className="hidden h-36 rounded-2xl border border-blue-100 bg-white/80 motion-safe:animate-pulse lg:block" />
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1480px] px-4 pt-6 sm:px-6 lg:px-8 lg:pt-8">
        <div className="grid gap-7 lg:grid-cols-[300px_minmax(0,1fr)] xl:gap-9">
          <div className="hidden h-[520px] rounded-2xl border bg-white p-5 lg:block">
            <div className="h-full rounded-xl bg-slate-100 motion-safe:animate-pulse" />
          </div>
          <div>
            <div className="h-14 border-b">
              <div className="h-7 w-48 rounded bg-slate-100 motion-safe:animate-pulse" />
            </div>
            <div className="mt-5 grid gap-5 2xl:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-[360px] rounded-2xl border bg-white p-6">
                  <div className="h-full rounded-xl bg-slate-100 motion-safe:animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
