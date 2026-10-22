import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

export type Stat = {
  label: string;
  value: number | string;
  /** Không còn hiển thị (phong cách cơ quan nhà nước: số liệu không kèm biểu tượng trang trí); giữ để tương thích. */
  icon?: LucideIcon;
  /** Chỉ dùng để suy ra mức cảnh báo: đỏ/hồng = có vấn đề, vàng/cam = cần chú ý, còn lại = bình thường. */
  accent: string;
  hint?: string;
};

/** Vạch màu mép trên ô số liệu theo ý nghĩa: đỏ = có vấn đề, vàng = cần chú ý, còn lại màu chủ đạo của phần mềm. */
export function statEdge(accent: string) {
  if (/rose|red/.test(accent)) return "border-t-rose-600";
  if (/amber|orange|yellow/.test(accent)) return "border-t-amber-500";
  return "border-t-primary";
}

/** Dãy ô số liệu: tên chỉ số (chữ hoa nhỏ), con số, ghi chú – không biểu tượng trang trí. */
export function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((s) => (
        <Card key={s.label} className={`rounded-md border-t-[3px] ${statEdge(s.accent)}`}>
          <CardContent className="p-4 sm:p-5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</div>
            <div className="mt-1.5 text-2xl font-bold tabular-nums sm:text-3xl">{s.value}</div>
            {s.hint && <div className="mt-0.5 text-xs text-muted-foreground">{s.hint}</div>}
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
