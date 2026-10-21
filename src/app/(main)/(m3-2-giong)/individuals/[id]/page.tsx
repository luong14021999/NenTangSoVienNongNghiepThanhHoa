import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, GitBranch } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { LinkList } from "@/components/m3/link-list";
import { individualStore, selectionRecordStore, sourceStockStore } from "@/lib/modules/m3/data/breeding";
import { INBREEDING_WARN, SELECTION_DECISIONS, ancestors, inbreeding } from "@/lib/modules/m3/breeding-rules";
import { byId } from "@/lib/platform/ref-options";
import { fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cá thể giống" };

/** Cá thể (M3.2.2): cây phả hệ 3 đời, hệ số cận huyết, đời con, chỉ tiêu chọn lọc. */
export default async function IndividualPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [all, records, stocks] = await Promise.all([individualStore.list(), selectionRecordStore.list(), sourceStockStore.list()]);
  const x = all.find((i) => i.id === id);
  if (!x) notFound();
  const map = byId(all);
  const F = inbreeding(all);
  const f = F.of(id);
  const tree = ancestors(id, all, 3);
  const children = all.filter((i) => i.sireId === id || i.damId === id);
  const myRecords = records.filter((r) => r.individualId === id).sort((a, b) => (b.measuredAt || "").localeCompare(a.measuredAt || ""));
  const fields: CrudField[] = [
    { name: "individualId", label: "Cá thể", type: "select", options: [{ value: x.id, label: x.code }], defaultValue: x.id },
    { name: "measuredAt", label: "Ngày đo", type: "date" },
    { name: "criterion", label: "Chỉ tiêu", required: true, placeholder: "VD: Khối lượng 6 tháng, Năng suất quả, Số con đẻ ra / lứa" },
    { name: "value", label: "Giá trị", type: "number", nullable: true },
    { name: "unit", label: "Đơn vị" },
    { name: "decision", label: "Quyết định", type: "select", options: [...SELECTION_DECISIONS] },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];

  return (
    <>
      <Header title={`Cá thể ${x.code}`} description={`${x.sex} · ${stocks.find((s) => s.id === x.stockId)?.name ?? "—"} · ${x.generation || "—"}`} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <Link href="/individuals" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Phả hệ & chọn lọc
        </Link>
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><GitBranch className="w-4 h-4" />Phả hệ 3 đời</CardTitle>
              <CardDescription>Bố › Bố = ông nội, Mẹ › Bố = ông ngoại…</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                {tree.map((a) => {
                  const n = map.get(a.id);
                  return (
                    <li key={`${a.path}-${a.id}`} style={{ paddingLeft: `${(a.depth - 1) * 20}px` }} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-36 shrink-0">{a.path}</span>
                      {n ? <Link href={`/individuals/${n.id}`} className="font-mono text-xs text-primary hover:underline">{n.code}</Link> : "—"}
                      <span className="text-[11px] text-muted-foreground">{n?.generation} · F {((F.of(a.id)) * 100).toLocaleString("vi-VN", { maximumFractionDigits: 2 })}%</span>
                    </li>
                  );
                })}
                {tree.length === 0 && <li className="text-muted-foreground text-sm">Chưa ghi bố mẹ</li>}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Hệ số cận huyết</CardTitle><CardDescription>Wright F = hệ số thân thuộc của bố và mẹ</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              <div className={`text-3xl font-semibold ${f >= INBREEDING_WARN ? "text-rose-600" : ""}`}>{(f * 100).toLocaleString("vi-VN", { maximumFractionDigits: 2 })}%</div>
              <p className="text-xs text-muted-foreground">Tham chiếu: con của anh chị em ruột 25%, của anh chị em cùng cha / mẹ 12,5%, của anh chị em họ 6,25%. Chỉ tính được trên phần phả hệ đã nhập.</p>
              {f >= INBREEDING_WARN && <Badge variant="destructive">Cần tránh ghép phối cận huyết</Badge>}
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader><CardTitle>Đời con ({children.length})</CardTitle></CardHeader>
          <CardContent><LinkList items={children.map((c) => ({ key: c.id, href: `/individuals/${c.id}`, code: c.code, text: `${c.sex} · ${c.generation || "—"} · ${fmtDateVN(c.bornAt)}` }))} /></CardContent>
        </Card>

        <CrudTableCard
          title="Chỉ tiêu chọn lọc"
          description="Ghi số đo theo thời gian và quyết định chọn / loại"
          endpoint="/api/selection-records"
          entity="selection-records"
          editFields={fields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/selection-records" title="Ghi chỉ tiêu" fields={fields} addLabel="Ghi chỉ tiêu" />}
          headers={["Ngày", "Chỉ tiêu", "Giá trị", "Quyết định"]}
          emptyText="Chưa có số đo"
          rows={myRecords.map((r) => ({
            id: r.id,
            label: r.criterion,
            initial: r,
            cells: [
              <span key="d" className="text-xs">{fmtDateVN(r.measuredAt)}</span>,
              <span key="c" className="text-sm">{r.criterion}</span>,
              <span key="v" className="text-sm tabular-nums">{r.value == null ? "—" : `${r.value.toLocaleString("vi-VN")} ${r.unit}`}</span>,
              <Badge key="x" variant={r.decision === "Chọn" ? "success" : r.decision === "Loại" ? "destructive" : "secondary"}>{r.decision}</Badge>,
            ],
          }))}
        />
      </main>
    </>
  );
}
