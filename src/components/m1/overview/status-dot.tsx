import { cn } from "@/lib/utils";
import { LEVEL_DOT, LEVEL_LABEL, type Level } from "./status";

/** Chấm trạng thái; mức "Hoạt động" có hiệu ứng nhịp (tắt khi người dùng giảm chuyển động). */
export function StatusDot({ level, className, label = true }: { level: Level; className?: string; label?: boolean }) {
  return (
    <span className={cn("relative inline-flex size-2.5 shrink-0", className)}>
      {level === "ok" && <span aria-hidden className={cn("absolute inset-0 rounded-full opacity-60 animate-ping motion-reduce:animate-none", LEVEL_DOT[level])} />}
      {(level === "down" || level === "warn") && <span aria-hidden className={cn("absolute -inset-0.5 rounded-full opacity-30", LEVEL_DOT[level])} />}
      <span aria-hidden className={cn("relative inline-flex size-2.5 rounded-full", LEVEL_DOT[level])} />
      {label && <span className="sr-only">{LEVEL_LABEL[level]}</span>}
    </span>
  );
}
