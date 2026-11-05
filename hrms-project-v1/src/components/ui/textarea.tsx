import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[96px] w-full rounded-[10px] border-0 bg-fill px-3.5 py-2.5 text-[15px] md:text-[14px] text-foreground transition-all duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] outline-none placeholder:text-label-tertiary focus:bg-surface focus:ring-1 focus:ring-primary focus:shadow-[0_0_0_3px_var(--primary-halo)] focus-visible:outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:ring-1 aria-invalid:ring-destructive aria-invalid:shadow-[0_0_0_3px_rgba(255,59,48,0.2)]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
