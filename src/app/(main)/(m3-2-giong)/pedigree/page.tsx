import Link from "next/link";
import { Baby, GitBranch, HeartHandshake } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { PedigreeTree, type TreeNode, type TreeSlot } from "@/components/m3/pedigree/pedigree-tree";
import { individualStore, sourceStockStore, varietyStore, type Individual } from "@/lib/modules/m3/data/breeding";
import { INBREEDING_WARN, INDIVIDUAL_STATUSES, inbreeding } from "@/lib/modules/m3/breeding-rules";
import { matingCandidates, pedigreeGrid } from "@/lib/modules/m3/breed-workspace";
import { suggestCode } from "@/lib/modules/m3/bench";
import { currentAccess } from "@/lib/platform/data/access";
import { byId } from "@/lib/platform/ref-options";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cây phả hệ & ghép phối" };

/** Số đời tổ tiên vẽ trên cây. */
const GENERATIONS = 3;
/** Số gợi ý ghép phối hiển thị. */
const MAX_CANDIDATES = 12;

const pct = (f: number) => `${(f * 100).toLocaleString("vi-VN", { maximumFractionDigits: 2 })}%`;

/** M3.2.2 – cây phả hệ trực quan, hệ số cận huyết, ghép phối thử và ghi đời con. */
export default async function PedigreePage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const sp = await searchParams;
  const [all, stocks, varieties, access] = await Promise.all([individualStore.list(), sourceStockStore.list(), varietyStore.list(), currentAccess()]);
  const map = byId(all);
  const stockById = byId(stocks);
  const varietyById = byId(varieties);
  const F = inbreeding(all);
  const today = todayISO();
  const sorted = [...all].sort((a, b) => a.code.localeCompare(b.code));
  // Mặc định: cá thể đang sử dụng có phả hệ sâu nhất được nhập gần nhất.
  const x = map.get(sp.id ?? "") ?? sorted.find((i) => i.status === "Đang sử dụng" && (i.sireId || i.damId)) ?? sorted[0] ?? null;
  const canWrite = access.can("write.breeding");

  const toNode = (i: Individual): TreeNode => ({
    id: i.id,
    code: i.code,
    sex: i.sex,
    sub: [varietyById.get(i.varietyId)?.name, i.generation, i.bornAt ? fmtDateVN(i.bornAt) : ""].filter(Boolean).join(" · "),
    f: F.of(i.id),
    status: i.status,
  });

  const picker = (
    <form method="get" action="/pedigree" className="flex flex-wrap items-center gap-2">
      <label htmlFor="pick" className="text-sm text-muted-foreground">Cá thể</label>
      <select id="pick" name="id" defaultValue={x?.id ?? ""} className="h-9 min-w-56 rounded-md border bg-background px-2 text-sm">
        {sorted.map((i) => <option key={i.id} value={i.id}>{i.code} · {i.sex}{stockById.get(i.stockId) ? ` · ${stockById.get(i.stockId)!.code}` : ""}{i.status !== "Đang sử dụng" ? ` (${i.status})` : ""}</option>)}
      </select>
      <Button type="submit" size="sm" variant="outline">Xem</Button>
      <Link href="/individuals" className="ml-auto text-xs text-primary hover:underline">Danh sách cá thể →</Link>
    </form>
  );

  if (!x) {
    return (
      <>
        <Header title="Cây phả hệ & ghép phối" description="Phả hệ trực quan, hệ số cận huyết, gợi ý ghép phối" />
        <main className="flex-1 p-4 sm:p-6"><p className="text-sm text-muted-foreground">Chưa có cá thể. Thêm cá thể ở trang <Link href="/individuals" className="text-primary hover:underline">Phả hệ & chọn lọc</Link>.</p></main>
      </>
    );
  }

  const grid = pedigreeGrid(x.id, all, GENERATIONS).map((row) => row.map<TreeSlot>((s) => ({ label: s.label, node: s.id && map.get(s.id) ? toNode(map.get(s.id)!) : null })));
  const children = all.filter((i) => i.sireId === x.id || i.damId === x.id).sort((a, b) => (b.bornAt || "").localeCompare(a.bornAt || ""));
  const candidates = matingCandidates(x.id, all).slice(0, MAX_CANDIDATES);
  const fx = F.of(x.id);
  const codes = all.map((i) => i.code);

  const childFields = (sire: Individual, dam: Individual): CrudField[] => [
    { name: "code", label: "Số hiệu đời con", required: true, mono: true },
    { name: "sex", label: "Giới tính", type: "select", options: ["—", "Đực", "Cái"] },
    { name: "sireId", label: "Bố", type: "select", options: [{ value: sire.id, label: sire.code }] },
    { name: "damId", label: "Mẹ", type: "select", options: [{ value: dam.id, label: dam.code }] },
    { name: "stockId", label: "Thuộc đàn / vườn", type: "select", options: [{ value: "", label: "— Chưa chọn —" }, ...stocks.map((s) => ({ value: s.id, label: `${s.code} · ${s.name}` }))] },
    { name: "varietyId", label: "Giống", type: "select", options: [{ value: "", label: "— Chưa chọn —" }, ...varieties.map((v) => ({ value: v.id, label: `${v.code} · ${v.name}` }))] },
    { name: "bornAt", label: "Ngày sinh / trồng", type: "date" },
    { name: "generation", label: "Thế hệ" },
    { name: "status", label: "Tình trạng", type: "select", options: [...INDIVIDUAL_STATUSES] },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];

  return (
    <>
      <Header title="Cây phả hệ & ghép phối" description="Phả hệ 3 đời trực quan, hệ số cận huyết Wright, gợi ý ghép phối theo cận huyết đời con, ghi đời con" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
        {picker}
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2"><GitBranch className="h-4 w-4" />Phả hệ {x.code}
              <Badge variant={fx >= INBREEDING_WARN ? "destructive" : "secondary"}>F = {pct(fx)}</Badge>
              <Link href={`/individuals/${x.id}`} className="text-xs font-normal text-primary hover:underline">Chỉ tiêu chọn lọc →</Link>
            </CardTitle>
            <CardDescription>Bấm vào một cá thể để xem phả hệ của cá thể đó. Viền xanh: đực · hồng: cái · F đỏ: ≥ {pct(INBREEDING_WARN)} (tương đương con của anh chị em họ).</CardDescription>
          </CardHeader>
          <CardContent>
            <PedigreeTree root={{ label: stockById.get(x.stockId)?.name ?? "Cá thể", node: toNode(x) }} generations={grid} warn={INBREEDING_WARN} />
            <div className="mt-4">
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Baby className="h-3.5 w-3.5" />Đời con ({children.length})</h3>
              {children.length === 0 ? (
                <p className="text-xs text-muted-foreground">Chưa có đời con.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {children.map((c) => (
                    <Link key={c.id} href={`/pedigree?id=${c.id}`} className={cn("rounded-md border border-l-4 px-2 py-1 text-xs hover:bg-accent", c.sex === "Đực" ? "border-l-sky-500" : c.sex === "Cái" ? "border-l-pink-500" : "")}>
                      <span className="font-mono font-semibold text-primary">{c.code}</span> <span className="text-muted-foreground">× {map.get(c.sireId === x.id ? c.damId : c.sireId)?.code ?? "?"} · F {pct(F.of(c.id))}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><HeartHandshake className="h-4 w-4" />Ghép phối thử cho {x.code}</CardTitle>
            <CardDescription>
              {x.sex === "Đực" || x.sex === "Cái"
                ? `Các cá thể ${x.sex === "Đực" ? "cái" : "đực"} đang sử dụng, xếp theo hệ số cận huyết của đời con (thấp trước). F đời con = hệ số thân thuộc của bố và mẹ; chỉ tính trên phả hệ đã nhập.`
                : "Cá thể chưa ghi giới tính – cập nhật ở trang Phả hệ & chọn lọc để có gợi ý ghép phối."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {candidates.length === 0 ? (
              <p className="text-sm text-muted-foreground">Không có cá thể phù hợp.</p>
            ) : (
              <ul className="divide-y">
                {candidates.map((c) => {
                  const sire = x.sex === "Đực" ? x : c.partner;
                  const dam = x.sex === "Đực" ? c.partner : x;
                  return (
                    <li key={c.partner.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                      <Link href={`/pedigree?id=${c.partner.id}`} className="w-28 font-mono text-xs font-semibold text-primary hover:underline">{c.partner.code}</Link>
                      <span className="min-w-0 flex-1 text-xs text-muted-foreground">
                        {[stockById.get(c.partner.stockId)?.name, c.partner.generation].filter(Boolean).join(" · ") || "—"}
                        {c.common.length > 0 && <> · tổ tiên chung: {c.common.map((id) => map.get(id)?.code ?? "?").join(", ")}</>}
                      </span>
                      <Badge variant={c.warn ? "destructive" : c.f > 0 ? "warning" : "success"}>F đời con {pct(c.f)}</Badge>
                      {canWrite && (
                        <EntityFormDialog
                          mode="add"
                          endpoint="/api/individuals"
                          title={`Ghi đời con ${sire.code} × ${dam.code}`}
                          description={`Hệ số cận huyết dự kiến của đời con: ${pct(c.f)}${c.warn ? " – vượt ngưỡng cảnh báo" : ""}.`}
                          fields={childFields(sire, dam)}
                          initial={{ code: suggestCode(dam.code, codes), sireId: sire.id, damId: dam.id, stockId: dam.stockId, varietyId: dam.varietyId || sire.varietyId, bornAt: today, status: "Đang sử dụng" }}
                          successText="Đã ghi đời con"
                          trigger={<Button size="sm" variant={c.warn ? "outline" : "default"} className="h-7 px-2 text-[11px]"><Baby />Ghi đời con</Button>}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
