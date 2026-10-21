"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  accreditedTests,
  matrixEn,
  type AccreditedMatrix,
} from "@/lib/modules/m2/accreditation";
import { cn } from "@/lib/utils";

type Filter = "all" | "soil" | "water" | "fertilizer" | "produce";

const filters: { key: Filter; label: string; matrices: AccreditedMatrix[] }[] = [
  { key: "all", label: "Tất cả", matrices: [] },
  { key: "soil", label: "Đất", matrices: ["Đất"] },
  { key: "water", label: "Nước", matrices: ["Nước mặt, nước ngầm", "Nước mặt"] },
  { key: "fertilizer", label: "Phân bón", matrices: ["Phân bón"] },
  { key: "produce", label: "Rau, quả", matrices: ["Rau, quả"] },
];

const matrixAccent: Record<AccreditedMatrix, string> = {
  "Đất": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Nước mặt, nước ngầm": "bg-blue-50 text-blue-700 border-blue-200",
  "Nước mặt": "bg-sky-50 text-sky-700 border-sky-200",
  "Phân bón": "bg-violet-50 text-violet-700 border-violet-200",
  "Rau, quả": "bg-amber-50 text-amber-700 border-amber-200",
};

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();

export function AccreditedTestsTable() {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const f = filters.find((x) => x.key === filter)!;
    const q = normalize(query.trim());
    return accreditedTests.filter(
      (t) =>
        (f.matrices.length === 0 || f.matrices.includes(t.matrix)) &&
        (!q ||
          normalize(`${t.name} ${t.nameEn} ${t.method} ${t.loq} ${t.matrix}`).includes(q)),
    );
  }, [filter, query]);

  const countOf = (key: Filter) => {
    const f = filters.find((x) => x.key === key)!;
    return f.matrices.length === 0
      ? accreditedTests.length
      : accreditedTests.filter((t) => f.matrices.includes(t.matrix)).length;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "h-8 px-3 rounded-full border text-xs font-medium transition-colors",
                filter === f.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-accent text-foreground/80",
              )}
            >
              {f.label}
              <span className="ml-1.5 opacity-70">{countOf(f.key)}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-md border border-input bg-background px-2.5 h-9 text-sm w-full lg:w-72">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent outline-none flex-1 min-w-0"
            placeholder="Tìm chỉ tiêu, phương pháp, TCVN…"
          />
        </div>
      </div>

      {/* Desktop: bảng */}
      <div className="hidden md:block rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr className="text-left">
              <th className="px-3 py-2.5 w-12 font-medium">TT</th>
              <th className="px-3 py-2.5 w-40 font-medium">Đối tượng thử</th>
              <th className="px-3 py-2.5 font-medium">Tên phép thử</th>
              <th className="px-3 py-2.5 w-44 font-medium">Giới hạn định lượng / Phạm vi đo</th>
              <th className="px-3 py-2.5 w-52 font-medium">Phương pháp thử</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((t) => (
              <tr key={t.no} className="align-top hover:bg-muted/30">
                <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{t.no}</td>
                <td className="px-3 py-2.5">
                  <Badge variant="outline" className={cn("text-[11px] font-medium", matrixAccent[t.matrix])}>
                    {t.matrix}
                  </Badge>
                  <div className="text-[11px] text-muted-foreground italic mt-1">{matrixEn[t.matrix]}</div>
                </td>
                <td className="px-3 py-2.5">
                  <div className="font-medium leading-snug">{t.name}</div>
                  <div className="text-xs text-muted-foreground italic mt-0.5 leading-snug">{t.nameEn}</div>
                </td>
                <td className="px-3 py-2.5 text-xs">{t.loq || "–"}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{t.method}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: thẻ */}
      <div className="md:hidden space-y-2.5">
        {rows.map((t) => (
          <div key={t.no} className="rounded-lg border p-3.5 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">#{t.no}</span>
              <Badge variant="outline" className={cn("text-[11px] font-medium", matrixAccent[t.matrix])}>
                {t.matrix}
              </Badge>
            </div>
            <div className="text-sm font-medium leading-snug">{t.name}</div>
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
              <span className="text-muted-foreground">GHĐL</span>
              <span>{t.loq || "–"}</span>
              <span className="text-muted-foreground">Phương pháp</span>
              <span className="font-mono">{t.method}</span>
            </div>
          </div>
        ))}
      </div>

      {rows.length === 0 && (
        <div className="text-center text-sm text-muted-foreground py-10">
          Không tìm thấy phép thử phù hợp
        </div>
      )}
    </div>
  );
}
