import { Skeleton } from "@/components/ui/skeleton";

export function SettingsSkeleton() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded-md" />
          <Skeleton className="h-4 w-80 rounded-md" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      {/* Settings Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={`set-tab-${i}`} className="h-9 w-28 rounded-xl shrink-0" />
        ))}
      </div>

      {/* Form Settings Card */}
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
        <div className="space-y-2 pb-4 border-b border-border/60">
          <Skeleton className="h-6 w-48 rounded-md" />
          <Skeleton className="h-4 w-96 rounded-md" />
        </div>

        <div className="space-y-5 max-w-2xl">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`input-${i}`} className="space-y-2">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-3 w-64 rounded-md" />
            </div>
          ))}

          {/* Toggle rows */}
          <div className="pt-2 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`toggle-${i}`}
                className="flex items-center justify-between p-4 rounded-xl border border-border/60"
              >
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-44 rounded-md" />
                  <Skeleton className="h-3 w-64 rounded-md" />
                </div>
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
            ))}
          </div>

          <div className="pt-4 flex items-center gap-3">
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-10 w-24 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
