import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "shimmer" | "circle" | "card";
}

export function Skeleton({
  className,
  variant = "shimmer",
  ...props
}: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-fill/60 relative overflow-hidden rounded-[8px]",
        variant === "shimmer" && "before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/25 dark:before:via-white/10 before:to-transparent",
        variant === "circle" && "rounded-full",
        variant === "card" && "rounded-[20px] bg-card apple-shadow-card p-6",
        className
      )}
      {...props}
    />
  );
}
