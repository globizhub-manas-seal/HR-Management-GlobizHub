import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "shimmer" | "circle" | "card";
}

export function Skeleton({
  className,
  variant = "default",
  ...props
}: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "rounded-md bg-muted/70 relative overflow-hidden",
        variant === "shimmer"
          ? "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 dark:before:via-white/5 before:to-transparent"
          : "animate-pulse",
        variant === "circle" && "rounded-full",
        variant === "card" && "rounded-2xl border border-border/50 bg-card/60",
        className
      )}
      {...props}
    />
  );
}
