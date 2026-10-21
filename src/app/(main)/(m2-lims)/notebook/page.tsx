import Link from "next/link";
import { BookOpen, PenLine, ShieldCheck } from "lucide-react";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  EntityFormDialog,
  type CrudField,
} from "@/components/crud/entity-form-dialog";
import { EntitySearchInput } from "@/components/crud/search-input";
import { StatGrid } from "@/components/common/stat-grid";
import { listNotebook, notebookSignedContent } from "@/lib/modules/m2/data/custody";
import { samplesStore } from "@/lib/modules/m2/data/samples";
import { equipmentStore } from "@/lib/modules/m2/data/equipment";
import { contentHash } from "@/lib/platform/signature";
import { testLabels } from "@/lib/modules/m2/accreditation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sổ tay thí nghiệm điện tử" };

const dt = (iso: string) => {
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date(iso));
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${g("day")}/${g("month")}/${g("year")} ${g("hour")}:${g("minute")}`;
};

export default async function NotebookPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sample?: string }>;
}) {
  const { q = "", sample = "" } = await searchParams;
  const [entries, samples, equipment] = await Promise.all([listNotebook(), samplesStore.list(), equipmentStore.list()]);
  const corrected = new Map(entries.filter((e) => e.correctsCode).map((e) => [e.correctsCode, e.code]));
  const query = q.trim().toLowerCase();
  const shown = entries.filter(
    (e) => (!sample || e.sampleCode === sample) && (!query || `${e.code} ${e.title} ${e.content} ${e.sampleCode} ${e.author}`.toLowerCase().includes(query)),
  );
  const intactCount = entries.filter((e) => contentHash(notebookSignedContent(e)) === e.contentHash).length;

  const FIELDS: CrudField[] = [
    { name: "title", label: "Tiêu đề", required: true, full: true, placeholder: "VD: Phá mẫu cường thủy lô 21/10" },
    { name: "sampleCode", label: "Mẫu (nếu có)", type: "select", options: [{ value: "", label: "—" }, ...samples.map((s) => ({ value: s.code, label: s.code }))], defaultValue: sample },
    { name: "testLabel", label: "Phép thử (nếu có)", type: "select", options: ["", ...testLabels] },
    { name: "content", label: "Nội dung: quy trình đã thực hiện, quan sát, số liệu, sai lệch…", type: "textarea", required: true },
    { name: "equipment", label: "Thiết bị sử dụng", type: "select", options: [{ value: "", label: "—" }, ...equipment.map((e) => ({ value: `${e.code} · ${e.name}`, label: `${e.code} · ${e.name}` }))], full: true },
    { name: "conditions", label: "Điều kiện (nhiệt độ, độ ẩm, …)", full: true },
    { name: "correctsCode", label: "Đính chính cho mục (nếu đây là bản đính chính)", type: "select", options: [{ value: "", label: "— không —" }, ...entries.map((e) => ({ value: e.code, label: `${e.code} · ${e.title}` }))], full: true },
  ];

  return (
    <>
      <Header
        title="Sổ tay thí nghiệm điện tử"
        description="M2.2 · ISO/IEC 17025:2017 §7.5 – chỉ ghi thêm, không sửa / xoá; đính chính bằng mục mới tham chiếu mục gốc; mỗi mục có mã băm nội dung"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Mục ghi", value: entries.length, icon: BookOpen, accent: "bg-blue-50 text-blue-600" },
            { label: "Đính chính", value: entries.filter((e) => e.correctsCode).length, icon: PenLine, accent: "bg-amber-50 text-amber-600" },
            { label: "Toàn vẹn", value: `${intactCount}/${entries.length}`, icon: ShieldCheck, accent: intactCount === entries.length ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600", hint: "nội dung khớp mã băm lúc ghi" },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          <EntitySearchInput basePath="/notebook" placeholder="Tìm mã, tiêu đề, nội dung, mẫu…" />
          {sample && <Badge variant="outline">Mẫu {sample} · <Link href="/notebook" className="ml-1 underline">bỏ lọc</Link></Badge>}
          <div className="ml-auto">
            <EntityFormDialog mode="add" endpoint="/api/notebook" title="Ghi sổ tay thí nghiệm" description="Người ghi và thời điểm lấy tự động; sau khi lưu không sửa / xoá được" fields={FIELDS} addLabel="Ghi mục mới" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Nhật ký thí nghiệm</CardTitle>
            <CardDescription>Mới nhất trước · mục bị đính chính vẫn được giữ nguyên để truy xuất</CardDescription>
          </CardHeader>
          <CardContent>
            {shown.length === 0 && <div className="text-sm text-muted-foreground py-6 text-center">Chưa có mục ghi nào</div>}
            <ol className="space-y-3">
              {shown.map((e) => {
                const intact = contentHash(notebookSignedContent(e)) === e.contentHash;
                const by = corrected.get(e.code);
                return (
                  <li key={e.id} id={e.code} className={`rounded-lg border p-4 ${by ? "bg-muted/40" : ""}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold">{e.code}</span>
                      <span className="text-sm font-semibold">{e.title}</span>
                      {e.correctsCode && <Badge variant="warning">Đính chính <a href={`#${e.correctsCode}`} className="ml-1 underline">{e.correctsCode}</a></Badge>}
                      {by && <Badge variant="secondary">Đã được đính chính bởi <a href={`#${by}`} className="ml-1 underline">{by}</a></Badge>}
                      {!intact && <Badge variant="destructive">Nội dung không khớp mã băm</Badge>}
                      <span className="ml-auto text-[11px] text-muted-foreground">{e.author} · {dt(e.at)}</span>
                    </div>
                    <div className="mt-2 text-sm whitespace-pre-wrap">{e.content}</div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                      {e.sampleCode && <Link href={`/samples/${encodeURIComponent(e.sampleCode)}`} className="hover:underline">Mẫu {e.sampleCode}</Link>}
                      {e.testLabel && <span>{e.testLabel.split(" · ").slice(0, 3).join(" · ")}</span>}
                      {e.equipment && <span>Thiết bị: {e.equipment}</span>}
                      {e.conditions && <span>Điều kiện: {e.conditions}</span>}
                      <span className="font-mono">SHA-256 {e.contentHash.slice(0, 12)}…</span>
                    </div>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
