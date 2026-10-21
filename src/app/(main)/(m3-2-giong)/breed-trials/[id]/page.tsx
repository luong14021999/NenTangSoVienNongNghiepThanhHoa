import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { CriteriaTable } from "@/components/m3/criteria-table";
import { breedStandardStore, breedTrialStore, standardCriterionStore, trialObservationStore, varietyStore } from "@/lib/modules/m3/data/breeding";
import { evaluateCriteria } from "@/lib/modules/m3/breeding-rules";
import { fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Khảo nghiệm" };

/** Khảo nghiệm (M3.2.3): số đo theo chỉ tiêu, tự đối chiếu với bộ chỉ tiêu theo quy chuẩn. */
export default async function BreedTrialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [trials, varieties, standards, criteria, observations] = await Promise.all([
    breedTrialStore.list(),
    varietyStore.list(),
    breedStandardStore.list(),
    standardCriterionStore.list(),
    trialObservationStore.list(),
  ]);
  const t = trials.find((x) => x.id === id);
  if (!t) notFound();
  const v = varieties.find((x) => x.id === t.varietyId);
  const std = standards.find((x) => x.id === t.standardId);
  const myCriteria = criteria.filter((c) => c.standardId === t.standardId).sort((a, b) => a.sortOrder - b.sortOrder);
  const myObs = observations.filter((o) => o.trialId === id);
  const evaluation = evaluateCriteria(myCriteria, myObs);
  const fields: CrudField[] = [
    { name: "trialId", label: "Khảo nghiệm", type: "select", options: [{ value: t.id, label: t.code }], defaultValue: t.id },
    myCriteria.length
      ? { name: "criterion", label: "Chỉ tiêu", type: "select", required: true, full: true, options: myCriteria.map((c) => c.criterion) }
      : { name: "criterion", label: "Chỉ tiêu", required: true, full: true },
    { name: "value", label: "Giá trị", type: "number", nullable: true },
    { name: "unit", label: "Đơn vị" },
    { name: "note", label: "Ghi chú (công thức, lần nhắc…)", type: "textarea" },
  ];

  return (
    <>
      <Header title={`Khảo nghiệm ${t.code}`} description={`${v?.name ?? "—"} · ${t.kind} · ${t.season} · ${t.site}`} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <Link href="/breed-trials" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Khảo nghiệm
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              Đối chiếu bộ chỉ tiêu
              <Badge variant={evaluation.overall === "Đạt" ? "success" : evaluation.overall === "Không đạt" ? "destructive" : "secondary"}>{evaluation.overall}</Badge>
              <span className="text-xs text-muted-foreground font-normal">kết quả ghi trên khảo nghiệm: {t.result}</span>
            </CardTitle>
            <CardDescription>{std ? `${std.code} · ${std.name}` : "Chưa chọn bộ chỉ tiêu – sửa khảo nghiệm ở danh sách để chọn"} · {fmtDateVN(t.startAt) || "—"} → {fmtDateVN(t.endAt) || "…"}</CardDescription>
          </CardHeader>
          <CardContent><CriteriaTable rows={evaluation.rows} /></CardContent>
        </Card>
        <CrudTableCard
          title="Số đo"
          description={`Tên chỉ tiêu khớp với bộ chỉ tiêu (không phân biệt dấu, hoa thường); trùng chỉ tiêu thì lấy dòng nhập sau.${myCriteria.length ? ` Chỉ tiêu trong bộ: ${myCriteria.map((c) => c.criterion).join(", ")}` : ""}`}
          endpoint="/api/trial-observations"
          entity="trial-observations"
          editFields={fields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/trial-observations" title="Nhập số đo" fields={fields} addLabel="Nhập số đo" />}
          headers={["Chỉ tiêu", "Giá trị", "Ghi chú"]}
          emptyText="Chưa có số đo"
          rows={myObs.map((o) => ({
            id: o.id,
            label: o.criterion,
            initial: o,
            cells: [
              <span key="c" className="text-sm">{o.criterion}</span>,
              <span key="v" className="text-sm tabular-nums">{o.value == null ? "—" : `${o.value.toLocaleString("vi-VN")} ${o.unit}`}</span>,
              <span key="n" className="text-xs text-muted-foreground">{o.note}</span>,
            ],
          }))}
        />
      </main>
    </>
  );
}
