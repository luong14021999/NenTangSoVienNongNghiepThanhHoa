import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import {
  breedTrialStore,
  productionLotStore,
  seedLotStore,
  sourceStockStore,
  varietyDocumentStore,
  varietyStore,
} from "@/lib/modules/m3/data/breeding";
import { ipAssetStore } from "@/lib/modules/m4/data/knowledge";
import { safeUrl } from "@/lib/modules/m4/data/portal";
import { DOC_KINDS, validityAlert } from "@/lib/modules/m3/breeding-rules";
import { varietyFields } from "@/lib/modules/m3/variety-fields";
import { LinkList } from "@/components/m3/link-list";
import { currentAccess } from "@/lib/platform/data/access";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Hồ sơ giống" };

/** Hồ sơ giống (M3.2.1): thông tin, văn bản pháp lý & hiệu lực, nguồn giống gốc, khảo nghiệm, sản xuất, lô giống. */
export default async function VarietyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [varieties, docs, stocks, trials, prodLots, seedLots, ipAssets, access] = await Promise.all([
    varietyStore.list(),
    varietyDocumentStore.list(),
    sourceStockStore.list(),
    breedTrialStore.list(),
    productionLotStore.list(),
    seedLotStore.list(),
    ipAssetStore.list(),
    currentAccess(),
  ]);
  const v = varieties.find((x) => x.id === id);
  if (!v) notFound();
  const today = todayISO();
  const ip = ipAssets.find((a) => a.id === v.ipAssetId);
  const myDocs = docs.filter((d) => d.varietyId === id).sort((a, b) => (b.issuedAt || "").localeCompare(a.issuedAt || ""));
  const docFields: CrudField[] = [
    { name: "varietyId", label: "Giống", type: "select", options: [{ value: v.id, label: v.name }], defaultValue: v.id },
    { name: "kind", label: "Loại văn bản", type: "select", options: [...DOC_KINDS] },
    { name: "number", label: "Số hiệu", mono: true },
    { name: "issuedAt", label: "Ngày ban hành", type: "date" },
    { name: "issuer", label: "Cơ quan ban hành" },
    { name: "validUntil", label: "Hiệu lực đến (nếu có)", type: "date" },
    { name: "url", label: "Bản điện tử (https://…)", full: true },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];

  return (
    <>
      <Header title={`${v.code} · ${v.name}`} description={`${v.kind} · ${v.species} · ${v.scope}`} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/varieties" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mr-auto">
            <ArrowLeft className="w-4 h-4" /> Lý lịch giống
          </Link>
          {access.can("write.breeding") && <EntityFormDialog mode="edit" endpoint="/api/varieties" id={v.id} title={`Sửa ${v.code}`} fields={varietyFields(ipAssets)} initial={v} />}
        </div>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2">Thông tin giống <Badge variant="outline">{v.status}</Badge></CardTitle></CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
              <dt className="text-muted-foreground">Nguồn gốc</dt><dd>{v.origin || "—"}</dd>
              <dt className="text-muted-foreground">Tác giả / chủ sở hữu</dt><dd>{v.owner || "—"}</dd>
              <dt className="text-muted-foreground">Công nhận</dt><dd>{v.recognitionNo ? `QĐ ${v.recognitionNo} ngày ${fmtDateVN(v.recognizedAt)}` : "—"}</dd>
              <dt className="text-muted-foreground">Lưu hành</dt><dd>{v.circulationType}{v.circulationNo && ` · ${v.circulationNo}`}{v.circulationAt && ` · ${fmtDateVN(v.circulationAt)}`}</dd>
              <dt className="text-muted-foreground">Bảo hộ</dt><dd>{ip ? <Link href={`/ip-assets?q=${encodeURIComponent(ip.code)}`} className="text-primary hover:underline">{ip.code} · {ip.grantNo || ip.status}{ip.expiresAt && ` · đến ${fmtDateVN(ip.expiresAt)}`}</Link> : "—"}</dd>
              <dt className="text-muted-foreground">Vùng khuyến cáo</dt><dd>{v.regions || "—"}</dd>
              <dt className="text-muted-foreground">Diện tích trên địa bàn</dt><dd>{v.areaHa ? `${v.areaHa.toLocaleString("vi-VN")} ha` : "—"}</dd>
            </dl>
            {v.traits && <p className="text-sm mt-3 whitespace-pre-line"><span className="text-muted-foreground">Đặc điểm: </span>{v.traits}</p>}
          </CardContent>
        </Card>

        <CrudTableCard
          title="Văn bản pháp lý"
          description="Văn bản có thời hạn được cảnh báo trước 90 ngày khi sắp hết hiệu lực"
          endpoint="/api/variety-documents"
          entity="variety-documents"
          editFields={docFields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/variety-documents" title="Thêm văn bản" fields={docFields} addLabel="Thêm văn bản" />}
          headers={["Loại", "Số hiệu · ngày", "Cơ quan", "Hiệu lực", "Bản điện tử"]}
          emptyText="Chưa có văn bản"
          rows={myDocs.map((d) => {
            const a = validityAlert(d.validUntil, today);
            const url = safeUrl(d.url);
            return {
              id: d.id,
              label: `${d.kind} ${d.number}`,
              initial: d,
              cells: [
                <span key="k" className="text-sm">{d.kind}</span>,
                <div key="n" className="text-xs"><span className="font-mono">{d.number || "—"}</span><div className="text-muted-foreground">{fmtDateVN(d.issuedAt)}</div></div>,
                <span key="i" className="text-xs">{d.issuer || "—"}</span>,
                <span key="v" className={`text-xs ${a ? (a.kind === "Hết hiệu lực" ? "text-rose-600 font-medium" : "text-amber-600") : ""}`}>{d.validUntil ? `${fmtDateVN(d.validUntil)}${a ? ` · ${a.kind.toLowerCase()} ${a.days} ngày` : ""}` : "không thời hạn"}</span>,
                url ? <a key="u" href={url} target="_blank" rel="noreferrer noopener" className="text-xs text-primary inline-flex items-center gap-1 hover:underline"><ExternalLink className="w-3 h-3" />Mở</a> : <span key="u" className="text-xs text-muted-foreground">—</span>,
              ],
            };
          })}
        />

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card><CardHeader><CardTitle>Nguồn giống gốc</CardTitle></CardHeader><CardContent><LinkList items={stocks.filter((s) => s.varietyId === id).map((s) => ({ key: s.id, href: `/source-stocks?q=${encodeURIComponent(s.code)}`, code: s.code, text: `${s.kind} · ${s.quantity}` }))} /></CardContent></Card>
          <Card><CardHeader><CardTitle>Khảo nghiệm</CardTitle></CardHeader><CardContent><LinkList items={trials.filter((t) => t.varietyId === id).map((t) => ({ key: t.id, href: `/breed-trials/${t.id}`, code: t.code, text: `${t.kind} · ${t.result}` }))} /></CardContent></Card>
          <Card><CardHeader><CardTitle>Lô sản xuất</CardTitle></CardHeader><CardContent><LinkList items={prodLots.filter((p) => p.varietyId === id).map((p) => ({ key: p.id, href: `/breed-production/${p.id}`, code: p.code, text: `${p.level} · ${p.season} · ${p.status}` }))} /></CardContent></Card>
          <Card><CardHeader><CardTitle>Lô giống</CardTitle></CardHeader><CardContent><LinkList items={seedLots.filter((s) => s.varietyId === id).map((s) => ({ key: s.id, href: `/seed-lots/${s.id}`, code: s.code, text: `${s.level} · ${s.quantity} ${s.unit} · ${s.status}` }))} /></CardContent></Card>
        </section>
      </main>
    </>
  );
}
