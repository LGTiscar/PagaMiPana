import { cn } from "@/lib/utils"

interface QuickSplitLogoProps {
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
}

export function QuickSplitLogo({ className, size = "md" }: QuickSplitLogoProps) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-4xl",
  }

  return (
    <span
      className={cn("quicksplit-logo font-bold", sizeClasses[size], className)}
      style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
    >
      QuickSplit
    </span>
  )
}

