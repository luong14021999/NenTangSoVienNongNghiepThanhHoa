import { Badge } from "@/components/ui/badge";
import type { CriterionResult } from "@/lib/modules/m3/breeding-rules";

const fmt = (v: number | null) => (v == null ? "" : v.toLocaleString("vi-VN"));

/** Bảng đối chiếu số đo với bộ chỉ tiêu (khảo nghiệm, lô giống). */
export function CriteriaTable({ rows }: { rows: CriterionResult[] }) {
  if (!rows.length) return <p className="text-sm text-muted-foreground">Chưa chọn bộ chỉ tiêu hoặc bộ chỉ tiêu chưa có chỉ tiêu.</p>;
  return (
    <div className="rounded-lg border overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs text-muted-foreground">
          <tr><th className="text-left font-medium px-3 py-2">Chỉ tiêu</th><th className="text-right font-medium px-3 py-2">Yêu cầu</th><th className="text-right font-medium px-3 py-2">Kết quả</th><th className="px-3 py-2" /></tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r) => (
            <tr key={r.criterion}>
              <td className="px-3 py-1.5">{r.criterion}</td>
              <td className="px-3 py-1.5 text-right text-xs tabular-nums whitespace-nowrap">
                {r.minValue != null && r.maxValue != null ? `${fmt(r.minValue)} – ${fmt(r.maxValue)}` : r.minValue != null ? `≥ ${fmt(r.minValue)}` : r.maxValue != null ? `≤ ${fmt(r.maxValue)}` : "—"} {r.unit}
              </td>
              <td className="px-3 py-1.5 text-right tabular-nums">{r.value == null ? "—" : fmt(r.value)}</td>
              <td className="px-3 py-1.5 text-right">
                <Badge variant={r.result === "Đạt" ? "success" : r.result === "Không đạt" ? "destructive" : "secondary"}>{r.result}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
