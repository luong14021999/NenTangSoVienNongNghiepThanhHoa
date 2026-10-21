import Link from "next/link";
import { Dna, ScanSearch, Percent, FlaskConical } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { StatGrid } from "@/components/common/stat-grid";
import { CsvImportBox } from "@/components/common/csv-import-box";
import { germplasmStore, individualStore, seedLotStore, varietyStore } from "@/lib/modules/m3/data/breeding";
import { genotypeCallStore, genotypeSampleStore } from "@/lib/modules/m3/data/genomics";
import { SAMPLE_PURPOSES, identifySample, profilesBySample, purityTest, referenceProfiles } from "@/lib/modules/m3/genomics";
import { byId, refOptions } from "@/lib/platform/ref-options";
import { fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mẫu ADN & kiểu gen" };

/** M3.2.5 – mẫu phân tích ADN, nhập kiểu gen, nhận dạng giống, giám định độ thuần theo lô. */
export default async function GenotypesPage() {
  const [samples, calls, varieties, seedLots, individuals, germplasm] = await Promise.all([
    genotypeSampleStore.list(),
    genotypeCallStore.list(),
    varietyStore.list(),
    seedLotStore.list(),
    individualStore.list(),
    germplasmStore.list(),
  ]);
  const varietyById = byId(varieties);
  const profiles = profilesBySample(calls);
  const refs = referenceProfiles(samples, profiles);
  const references = [...refs.entries()].map(([id, profile]) => ({ id, label: varietyById.get(id)?.name ?? id, profile }));
  const fields: CrudField[] = [
    { name: "code", label: "Mã mẫu ADN", required: true, mono: true },
    { name: "purpose", label: "Mục đích", type: "select", options: [...SAMPLE_PURPOSES] },
    { name: "varietyId", label: "Giống (bắt buộc với mẫu tham chiếu)", type: "select", options: refOptions(varieties, (v) => `${v.code} · ${v.name}`) },
    { name: "seedLotId", label: "Lô giống (bắt buộc với cây kiểm tra độ thuần)", type: "select", options: refOptions(seedLots, (s) => `${s.code} · ${s.level}`) },
    { name: "individualId", label: "Cá thể", type: "select", options: refOptions(individuals, (i) => i.code) },
    { name: "germplasmId", label: "Nguồn gen", type: "select", options: refOptions(germplasm, (g) => `${g.code} · ${g.species}`) },
    { name: "labSampleCode", label: "Mã mẫu M2 (nếu phân tích tại PTN)", mono: true },
    { name: "collectedAt", label: "Ngày lấy mẫu", type: "date" },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];
  const unknowns = samples.filter((s) => s.purpose === "Mẫu cần nhận dạng");
  const lotsTested = [...new Set(samples.filter((s) => s.purpose === "Cây kiểm tra độ thuần" && s.seedLotId).map((s) => s.seedLotId))];
  const purityOf = (lotId: string) => {
    const lot = seedLots.find((l) => l.id === lotId);
    const ref = lot ? refs.get(lot.varietyId) : undefined;
    const plants = samples
      .filter((s) => s.seedLotId === lotId && s.purpose === "Cây kiểm tra độ thuần")
      .map((s) => ({ id: s.id, label: s.code, profile: profiles.get(s.id) ?? new Map() }));
    return { lot, ref, result: ref ? purityTest(plants, ref) : null, plants: plants.length };
  };

  return (
    <>
      <Header title="Mẫu ADN & kiểu gen" description="Kiểu gen SSR, SNP, mã vạch ADN – nhận dạng giống và giám định độ thuần" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Mẫu ADN", value: samples.length, icon: Dna, accent: "bg-violet-50 text-violet-600" },
            { label: "Giống có hồ sơ chuẩn", value: refs.size, icon: FlaskConical, accent: "bg-emerald-50 text-emerald-700" },
            { label: "Mẫu cần nhận dạng", value: unknowns.length, icon: ScanSearch, accent: "bg-blue-50 text-blue-600" },
            { label: "Lô đã giám định độ thuần", value: lotsTested.length, icon: Percent, accent: "bg-amber-50 text-amber-600" },
          ]}
        />
        <Card>
          <CardHeader>
            <CardTitle>Nhập kiểu gen</CardTitle>
            <CardDescription>Chép bảng từ Excel: Mã mẫu · Mã chỉ thị · Alen 1 · Alen 2 (trống = đồng hợp). Mẫu và chỉ thị phải có trong danh mục trước</CardDescription>
          </CardHeader>
          <CardContent>
            <CsvImportBox
              endpoint="/api/genotype-calls/import"
              example={"Mã mẫu\tMã chỉ thị\tAlen 1\tAlen 2\nREF-BT7\tRM190\t110\t110\nREF-BT7\tRM21\t124\t130"}
              help="Trùng mẫu – chỉ thị thì cập nhật alen; lỗi ở dòng nào thì không ghi gì."
              label="Nhập kiểu gen"
            />
          </CardContent>
        </Card>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Nhận dạng giống</CardTitle><CardDescription>Giống tham chiếu gần nhất của từng mẫu (cần ≥ 3 chỉ thị chung)</CardDescription></CardHeader>
            <CardContent>
              <ul className="divide-y text-sm">
                {unknowns.map((s) => {
                  const best = identifySample(profiles.get(s.id) ?? new Map(), references)[0];
                  return (
                    <li key={s.id} className="py-1.5 flex flex-wrap justify-between gap-2">
                      <Link href={`/genotypes/${s.id}`} className="font-mono text-xs text-primary hover:underline">{s.code}</Link>
                      <span className="text-xs">
                        {best ? (
                          <>
                            {best.ref.label} · {best.similarity == null ? "—" : `${Math.round(best.similarity * 1000) / 10}%`} · {best.compared} chỉ thị ·{" "}
                            <Badge variant={best.conclusion === "Trùng khớp" ? "success" : best.conclusion === "Khác giống" ? "destructive" : "secondary"}>{best.conclusion}</Badge>
                          </>
                        ) : (
                          <span className="text-muted-foreground">chưa có giống tham chiếu</span>
                        )}
                      </span>
                    </li>
                  );
                })}
                {unknowns.length === 0 && <li className="py-1.5 text-xs text-muted-foreground">Chưa có mẫu cần nhận dạng</li>}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Giám định độ thuần theo lô</CardTitle><CardDescription>Cây đúng giống = khớp hoàn toàn hồ sơ chuẩn trên mọi chỉ thị chung</CardDescription></CardHeader>
            <CardContent>
              <ul className="divide-y text-sm">
                {lotsTested.map((id) => {
                  const p = purityOf(id);
                  return (
                    <li key={id} className="py-1.5 flex flex-wrap justify-between gap-2">
                      <Link href={`/seed-lots/${id}`} className="font-mono text-xs text-primary hover:underline">{p.lot?.code ?? id}</Link>
                      <span className="text-xs">
                        {!p.ref ? (
                          <span className="text-amber-600">giống chưa có hồ sơ chuẩn</span>
                        ) : p.result?.purity == null ? (
                          `${p.plants} cây – chưa đủ chỉ thị`
                        ) : (
                          <>
                            <b>{p.result.purity.toLocaleString("vi-VN")}%</b> · {p.result.trueToType}/{p.result.tested} cây đúng giống
                            {p.result.offTypes.length > 0 && ` · khác dạng: ${p.result.offTypes.map((o) => o.label).join(", ")}`}
                          </>
                        )}
                      </span>
                    </li>
                  );
                })}
                {lotsTested.length === 0 && <li className="py-1.5 text-xs text-muted-foreground">Chưa có cây kiểm tra độ thuần</li>}
              </ul>
            </CardContent>
          </Card>
        </section>

        <CrudTableCard
          title="Mẫu ADN"
          description="Bấm mã mẫu để xem hồ sơ kiểu gen và so với các giống tham chiếu"
          endpoint="/api/genotype-samples"
          entity="genotype-samples"
          editFields={fields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/genotype-samples" title="Thêm mẫu ADN" fields={fields} addLabel="Thêm mẫu" />}
          headers={["Mã mẫu", "Mục đích", "Gắn với", "Số chỉ thị", "Ngày lấy"]}
          emptyText="Chưa có mẫu ADN"
          rows={[...samples].sort((a, b) => a.code.localeCompare(b.code)).map((s) => ({
            id: s.id,
            label: s.code,
            initial: s,
            cells: [
              <Link key="c" href={`/genotypes/${s.id}`} className="font-mono text-xs font-semibold text-primary hover:underline">{s.code}</Link>,
              <Badge key="p" variant={s.purpose === "Giống tham chiếu" ? "success" : "outline"}>{s.purpose}</Badge>,
              <span key="g" className="text-xs">
                {[varietyById.get(s.varietyId)?.name, seedLots.find((l) => l.id === s.seedLotId)?.code, individuals.find((i) => i.id === s.individualId)?.code].filter(Boolean).join(" · ") || "—"}
              </span>,
              <span key="n" className="text-xs">{profiles.get(s.id)?.size ?? 0}</span>,
              <span key="d" className="text-xs">{fmtDateVN(s.collectedAt)}</span>,
            ],
          }))}
        />
      </main>
    </>
  );
}
