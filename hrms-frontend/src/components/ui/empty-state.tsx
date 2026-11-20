import * as React from "react"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 sm:p-12 gap-3.5",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-center size-14 rounded-full bg-fill/50 text-label-tertiary">
        <Icon className="size-8 stroke-[1.5]" />
      </div>

      <div className="flex flex-col gap-1 max-w-sm">
        <h3 className="type-headline font-semibold text-foreground tracking-tight">
          {title}
        </h3>
        {description && (
          <p className="type-footnote text-label-secondary font-normal">
            {description}
          </p>
        )}
      </div>

      {actionLabel && onAction && (
        <div className="mt-2">
          <Button variant="default" size="default" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  )
}

