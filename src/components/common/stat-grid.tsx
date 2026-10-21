import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export type Stat = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent: string;
  hint?: string;
};

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
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${s.accent}`}
            >
              <s.icon className="w-5 h-5" />
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
