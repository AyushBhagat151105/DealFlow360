import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-border",
        success:
          "border-transparent bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 dark:bg-emerald-500/20 dark:text-emerald-400",
        warning:
          "border-transparent bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 dark:bg-amber-500/20 dark:text-amber-400",
        danger:
          "border-transparent bg-rose-500/15 text-rose-600 hover:bg-rose-500/25 dark:bg-rose-500/20 dark:text-rose-400",
        info:
          "border-transparent bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 dark:bg-blue-500/20 dark:text-blue-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
