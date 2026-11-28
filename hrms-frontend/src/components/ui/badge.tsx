import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full px-2.5 text-[12px] font-semibold tracking-tight whitespace-nowrap transition-colors [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "bg-primary/12 text-primary dark:bg-primary/20",
        secondary:
          "bg-fill text-label-secondary",
        success:
          "bg-[rgba(52,199,89,0.15)] text-[#28a745] dark:text-[#30D158] dark:bg-[rgba(48,209,88,0.20)]",
        warning:
          "bg-[rgba(255,149,0,0.15)] text-[#d97706] dark:text-[#FF9F0A] dark:bg-[rgba(255,159,10,0.20)]",
        destructive:
          "bg-[rgba(255,59,48,0.15)] text-[#dc2626] dark:text-[#FF453A] dark:bg-[rgba(255,69,58,0.20)]",
        outline:
          "border border-hairline border-separator bg-transparent text-label-secondary",
        ghost:
          "text-label-secondary hover:bg-fill",
        link:
          "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
