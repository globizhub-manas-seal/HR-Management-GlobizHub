import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[10px] text-sm font-medium tracking-tight whitespace-nowrap select-none outline-none transition-all duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] motion-reduce:transform-none disabled:pointer-events-none disabled:opacity-40 disabled:transform-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 apple-shadow-sm",
        filled:
          "bg-primary text-primary-foreground hover:bg-primary/90 apple-shadow-sm",
        secondary:
          "bg-primary/12 text-primary hover:bg-primary/18 dark:bg-primary/20 dark:hover:bg-primary/28",
        tinted:
          "bg-primary/12 text-primary hover:bg-primary/18 dark:bg-primary/20 dark:hover:bg-primary/28",
        outline:
          "border border-hairline border-separator bg-surface text-foreground hover:bg-fill apple-shadow-sm",
        ghost:
          "text-primary hover:bg-fill",
        plain:
          "text-primary hover:bg-fill",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 apple-shadow-sm",
        "destructive-tinted":
          "bg-destructive/12 text-destructive hover:bg-destructive/20",
        link:
          "text-primary underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        default:
          "min-h-[36px] h-9 md:h-9 px-3.5 text-[14px] gap-1.5",
        touch:
          "min-h-[44px] h-11 px-4 text-[15px] gap-2",
        xs:
          "h-7 min-h-[28px] px-2 text-xs rounded-[8px] gap-1 [&_svg:not([class*='size-'])]:size-3",
        sm:
          "h-8 min-h-[32px] px-2.5 text-[13px] rounded-[8px] gap-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg:
          "min-h-[44px] h-11 px-5 text-[15px] rounded-[10px] gap-2",
        icon:
          "size-9 min-h-[36px] min-w-[36px] p-0 rounded-[10px]",
        "icon-sm":
          "size-8 min-h-[32px] min-w-[32px] p-0 rounded-[8px]",
        "icon-touch":
          "size-11 min-h-[44px] min-w-[44px] p-0 rounded-[10px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size, className }));

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ...props,
      className: cn(classes, (children.props as { className?: string }).className),
    });
  }

  return (
    <ButtonPrimitive
      data-slot="button"
      className={classes}
      {...props}
    >
      {children}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
