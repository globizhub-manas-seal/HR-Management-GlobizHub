"use client"

import * as React from "react"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface InsetGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode
  footer?: React.ReactNode
}

export function InsetGroup({
  className,
  header,
  footer,
  children,
  ...props
}: InsetGroupProps) {
  return (
    <div className={cn("w-full flex flex-col gap-1.5", className)} {...props}>
      {header && (
        <div className="px-4 text-[13px] font-medium text-label-secondary uppercase tracking-wider">
          {header}
        </div>
      )}
      <div className="overflow-hidden rounded-[16px] bg-card border-0 dark:border dark:border-hairline dark:border-separator apple-shadow-card">
        {children}
      </div>
      {footer && (
        <div className="px-4 text-[12px] text-label-tertiary">
          {footer}
        </div>
      )}
    </div>
  )
}

export interface InsetRowProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  label: React.ReactNode
  sublabel?: React.ReactNode
  value?: React.ReactNode
  navigable?: boolean
  onClick?: () => void
  trailing?: React.ReactNode
  hasBorder?: boolean
}

export function InsetRow({
  className,
  icon,
  label,
  sublabel,
  value,
  navigable = false,
  onClick,
  trailing,
  hasBorder = true,
  ...props
}: InsetRowProps) {
  const content = (
    <div
      className={cn(
        "relative flex min-h-[44px] items-center justify-between px-4 py-2.5 transition-colors duration-150 ease-[cubic-bezier(0.32,0.72,0,1)]",
        onClick && "cursor-pointer hover:bg-fill/40 active:bg-fill/60",
        className
      )}
      onClick={onClick}
      {...props}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {icon && <div className="text-primary shrink-0">{icon}</div>}
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[15px] font-normal text-foreground truncate">
            {label}
          </span>
          {sublabel && (
            <span className="text-[12px] text-label-secondary truncate">
              {sublabel}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-3">
        {value && (
          <span className="text-[15px] text-label-secondary font-normal">
            {value}
          </span>
        )}
        {trailing}
        {navigable && (
          <ChevronRight className="size-4 text-label-tertiary shrink-0" />
        )}
      </div>

      {hasBorder && (
        <div className="absolute bottom-0 left-4 right-0 h-[0.5px] bg-separator/50" />
      )}
    </div>
  )

  return content
}
