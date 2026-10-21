import Link from "next/link";
import { cn } from "@/lib/utils";

export type TreeNode = { id: string; code: string; sex: string; sub: string; f: number; status: string };
export type TreeSlot = { node: TreeNode | null; label: string };

const sexTone = (sex: string) =>
  sex === "Đực" ? "border-l-sky-500" : sex === "Cái" ? "border-l-pink-500" : "border-l-border";
const pct = (f: number) => `${(f * 100).toLocaleString("vi-VN", { maximumFractionDigits: 2 })}%`;

function NodeCard({ slot, warn, root = false }: { slot: TreeSlot; warn: number; root?: boolean }) {
  const n = slot.node;
  if (!n) {
    return (
      <div className="rounded-lg border border-dashed px-2 py-1.5 text-[11px] text-muted-foreground">
        <div>{slot.label}</div>
        <div className="italic">chưa rõ</div>
      </div>
    );
  }
  return (
    <Link
      href={`/pedigree?id=${n.id}`}
      className={cn("block rounded-lg border border-l-4 bg-card px-2 py-1.5 shadow-sm transition hover:border-primary/50 hover:shadow", sexTone(n.sex), root && "ring-2 ring-primary")}
    >
      <div className="text-[10px] text-muted-foreground">{slot.label}</div>
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-xs font-semibold text-primary">{n.code}</span>
        <span className="text-[10px] text-muted-foreground">{n.sex}</span>
      </div>
      <div className="truncate text-[10px] text-muted-foreground" title={n.sub}>{n.sub}</div>
      <div className={cn("text-[10px] tabular-nums", n.f >= warn ? "font-semibold text-rose-600" : "text-muted-foreground")}>F {pct(n.f)}{n.status !== "Đang sử dụng" && ` · ${n.status}`}</div>
    </Link>
  );
}

/** Cây phả hệ nằm ngang: cá thể gốc bên trái, mỗi cột về bên phải là một đời tổ tiên (bố trên, mẹ dưới). */
export function PedigreeTree({ root, generations, warn }: { root: TreeSlot; generations: TreeSlot[][]; warn: number }) {
  const cols = [[root], ...generations];
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <div className="grid min-w-[52rem] gap-3" style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(10rem, 1fr))` }}>
        {cols.map((col, g) => (
          <div key={g} className="flex flex-col">
            <div className="mb-2 text-center text-[11px] font-medium text-muted-foreground">{g === 0 ? "Cá thể" : g === 1 ? "Bố mẹ" : g === 2 ? "Ông bà" : "Cụ"}</div>
            <div className="flex flex-1 flex-col justify-around gap-2">
              {col.map((slot, i) => (
                <div key={i} className="relative">
                  {g > 0 && <span aria-hidden className="absolute -left-3 top-1/2 h-px w-3 bg-border" />}
                  <NodeCard slot={slot} warn={warn} root={g === 0} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
