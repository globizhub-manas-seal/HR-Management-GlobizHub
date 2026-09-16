import { Skeleton } from "@/components/ui/skeleton";

export function NotificationListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-1 p-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`notif-${i}`}
          className="flex items-start gap-3 p-3 rounded-xl border border-border/40 hover:bg-muted/30 transition-colors"
        >
          <Skeleton className="h-9 w-9 rounded-full shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4 rounded-md" />
            <Skeleton className="h-3 w-full rounded-md" />
            <Skeleton className="h-2.5 w-20 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
