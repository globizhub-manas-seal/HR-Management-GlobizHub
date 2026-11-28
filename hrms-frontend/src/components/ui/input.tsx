import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 md:h-10 w-full min-w-0 rounded-[10px] border-0 bg-fill px-3.5 py-2 text-[15px] md:text-[14px] text-foreground transition-all duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-label-tertiary focus:bg-surface focus:ring-1 focus:ring-primary focus:shadow-[0_0_0_3px_var(--primary-halo)] focus-visible:outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:ring-1 aria-invalid:ring-destructive aria-invalid:shadow-[0_0_0_3px_rgba(255,59,48,0.2)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
