import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TableSkeletonProps {
  rowCount?: number;
  columnCount?: number;
  showSearch?: boolean;
  showPagination?: boolean;
  showAvatar?: boolean;
  title?: string;
  subtitle?: string;
}

export function TableSkeleton({
  rowCount = 5,
  columnCount = 5,
  showSearch = true,
  showPagination = true,
  showAvatar = true,
  title,
  subtitle,
}: TableSkeletonProps) {
  return (
    <div className="space-y-4">
      {(title || showSearch) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {title ? (
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>
          )}

          {showSearch && (
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-64 rounded-xl" />
              <Skeleton className="h-10 w-28 rounded-xl" />
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              {Array.from({ length: columnCount }).map((_, i) => (
                <TableHead key={`th-${i}`}>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rowCount }).map((_, rowIndex) => (
              <TableRow key={`row-${rowIndex}`} className="hover:bg-transparent">
                {Array.from({ length: columnCount }).map((_, colIndex) => (
                  <TableCell key={`cell-${rowIndex}-${colIndex}`} className="py-3.5">
                    {colIndex === 0 && showAvatar ? (
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                        <div className="space-y-1.5 flex-1">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                      </div>
                    ) : colIndex === columnCount - 1 ? (
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-8 rounded-lg" />
                      </div>
                    ) : (
                      <Skeleton
                        className="h-4"
                        style={{
                          width: `${Math.max(40, ((colIndex * 37 + rowIndex * 19) % 50) + 45)}%`,
                        }}
                      />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {showPagination && (
          <div className="p-4 border-t border-border flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-16 rounded-lg" />
              <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
