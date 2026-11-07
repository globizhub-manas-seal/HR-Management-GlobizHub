"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked = false, onCheckedChange, disabled, onClick, ...props }, ref) => {
    const [isChecked, setIsChecked] = React.useState(checked)

    React.useEffect(() => {
      setIsChecked(checked)
    }, [checked])

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return
      const next = !isChecked
      setIsChecked(next)
      onCheckedChange?.(next)
      onClick?.(e)
    }

    return (
      <button
        type="button"
        role="switch"
        aria-checked={isChecked}
        ref={ref}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          "relative inline-flex h-[31px] w-[51px] shrink-0 cursor-pointer rounded-full p-[2px] transition-colors duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40",
          isChecked ? "bg-status-green" : "bg-separator/60 dark:bg-separator",
          className
        )}
        {...props}
      >
        <span
          className={cn(
            "pointer-events-none block size-[27px] rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.2)] transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]",
            isChecked ? "translate-x-[20px]" : "translate-x-0"
          )}
        />
      </button>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }

