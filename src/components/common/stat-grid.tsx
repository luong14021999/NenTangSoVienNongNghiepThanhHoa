import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export type Stat = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent: string;
  hint?: string;
};

/**
 * Màu ô biểu tượng theo ý nghĩa, không theo sắc màu trang trí: đỏ = có vấn đề, vàng = cần chú ý,
 * còn lại dùng màu chủ đạo của phần mềm (đơn sắc, viền mảnh – phong cách văn bản hành chính).
 */
export function iconTone(accent: string) {
  if (/rose|red/.test(accent)) return "border-rose-200 text-rose-700 bg-rose-50/60";
  if (/amber|orange|yellow/.test(accent)) return "border-amber-200 text-amber-700 bg-amber-50/60";
  return "border-primary/20 text-primary bg-primary/5";
}

export function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardContent className="p-5 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {s.label}
              </div>
              <div className="text-3xl font-semibold mt-1.5">{s.value}</div>
              {s.hint && (
                <div className="text-xs text-muted-foreground mt-0.5">{s.hint}</div>
              )}
            </div>
            <div
              className={`w-10 h-10 rounded-md border flex items-center justify-center shrink-0 ${iconTone(s.accent)}`}
            >
              <s.icon className="w-5 h-5" strokeWidth={1.75} />
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

/** Rút gọn văn bản dài cho ô bảng. */
export function clip(text: string, max = 110) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
