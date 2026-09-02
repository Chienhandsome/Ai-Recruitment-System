import { Skeleton } from "@/components/ui/skeleton";

export default function CandidateProfileLoading() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44 rounded-xl" />
          <Skeleton className="h-4 w-80 rounded-lg" />
        </div>

        {/* Profile Card Skeleton */}
        <div className="rounded-2xl border bg-surface p-6 space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="size-20 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48 rounded-lg" />
              <Skeleton className="h-4 w-32 rounded-md" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 pt-3">
            <Skeleton className="h-9 rounded-xl" />
            <Skeleton className="h-9 rounded-xl" />
            <Skeleton className="h-9 rounded-xl" />
          </div>
        </div>

        {/* Work Experience Skeleton */}
        <div className="rounded-2xl border bg-surface p-6 space-y-4">
          <Skeleton className="h-6 w-52 rounded-lg" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>

        {/* Education Skeleton */}
        <div className="rounded-2xl border bg-surface p-6 space-y-4">
          <Skeleton className="h-6 w-44 rounded-lg" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
