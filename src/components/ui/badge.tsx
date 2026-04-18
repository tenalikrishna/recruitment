import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#3191c2] text-white hover:bg-[#2577a8]",
        secondary:
          "border-transparent bg-[#1e293b] text-slate-200 hover:bg-[#334155]",
        destructive:
          "border-transparent bg-red-500 text-white hover:bg-red-600",
        outline: "text-slate-300 border-[#334155]",
        success:
          "border-transparent bg-green-500 text-white",
        warning:
          "border-transparent bg-yellow-500 text-[#0f172a]",
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
