import { Skeleton } from "@/components/ui/skeleton";

interface CardGridSkeletonProps {
  count?: number;
  columns?: 2 | 3 | 4;
  showAvatar?: boolean;
}

export function CardGridSkeleton({
  count = 8,
  columns = 4,
  showAvatar = true,
}: CardGridSkeletonProps) {
  const gridClasses = {
    2: "grid grid-cols-1 md:grid-cols-2 gap-6",
    3: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",
    4: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
  }[columns];

  return (
    <div className={gridClasses}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`card-skel-${i}`}
          className="bg-card border border-border rounded-2xl p-5 flex flex-col items-center text-center shadow-sm space-y-4"
        >
          {showAvatar ? (
            <Skeleton className="h-20 w-20 rounded-full" />
          ) : (
            <Skeleton className="h-12 w-12 rounded-xl" />
          )}

          <div className="space-y-2 w-full flex flex-col items-center">
            <Skeleton className="h-5 w-3/4 rounded-md" />
            <Skeleton className="h-4 w-1/2 rounded-md" />
          </div>

          <div className="w-full pt-2 border-t border-border/60 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>

          <div className="w-full pt-1 flex gap-2">
            <Skeleton className="h-9 flex-1 rounded-xl" />
            <Skeleton className="h-9 w-9 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
