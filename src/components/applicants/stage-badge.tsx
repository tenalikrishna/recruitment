import { STAGE_COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"

export function StageBadge({ stage, className }: { stage: string; className?: string }) {
  const color = STAGE_COLORS[stage] ?? "bg-slate-500"
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white whitespace-nowrap", color, className)}>
      {stage}
    </span>
  )
}
