import Link from "next/link";
import { FileDown, Award, Megaphone, Globe } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { StatGrid, clip } from "@/components/common/stat-grid";
import { RESOURCE_KINDS, publicResourceStore, safeUrl } from "@/lib/modules/m4/data/portal";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nội dung công khai" };

const FIELDS: CrudField[] = [
  { name: "code", label: "Mã", required: true, mono: true, placeholder: "VD: BM-01" },
  { name: "kind", label: "Loại", type: "select", options: [...RESOURCE_KINDS] },
  { name: "title", label: "Tiêu đề", required: true, full: true },
  { name: "url", label: "Đường dẫn tải về / xem (https://…)", full: true, placeholder: "https://…" },
  { name: "sortOrder", label: "Thứ tự hiển thị", type: "number" },
  { name: "published", label: "Công bố trên cổng", type: "bool", boolLabels: ["Công bố", "Không công bố"], defaultValue: 0 },
  { name: "description", label: "Mô tả ngắn (hiện trên cổng)", type: "textarea" },
  { name: "note", label: "Ghi chú nội bộ", type: "textarea" },
];

export default async function PublicContentPage() {
  const all = (await publicResourceStore.list()).sort((a, b) => a.kind.localeCompare(b.kind) || a.sortOrder - b.sortOrder);
  const count = (k: string) => all.filter((x) => x.kind === k).length;

  return (
    <>
      <Header title="Nội dung công khai" description="Biểu mẫu, hồ sơ năng lực và thông báo hiển thị trên cổng dịch vụ – chỉ mục Công bố mới hiện ra ngoài" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Biểu mẫu", value: count("Biểu mẫu"), icon: FileDown, accent: "bg-blue-50 text-blue-600" },
            { label: "Năng lực", value: count("Năng lực"), icon: Award, accent: "bg-violet-50 text-violet-600" },
            { label: "Thông báo", value: count("Thông báo"), icon: Megaphone, accent: "bg-amber-50 text-amber-600" },
            { label: "Đang công bố", value: all.filter((x) => x.published).length, icon: Globe, accent: "bg-emerald-50 text-emerald-700" },
          ]}
        />
        <Link href="/portal" target="_blank" className="text-xs text-primary hover:underline">Xem cổng công khai →</Link>
        <CrudTableCard
          title="Danh sách nội dung"
          description="Phạm vi công nhận VILAS 1501 được lấy tự động từ M2, không cần nhập ở đây"
          endpoint="/api/public-resources"
          entity="public-resources"
          editFields={FIELDS}
          addNode={<EntityFormDialog mode="add" endpoint="/api/public-resources" title="Thêm nội dung" fields={FIELDS} addLabel="Thêm nội dung" />}
          headers={["Mã / loại", "Tiêu đề", "Đường dẫn", "Thứ tự", "Công bố"]}
          emptyText="Chưa có nội dung nào"
          rows={all.map((x) => ({
            id: x.id,
            label: x.title,
            initial: x,
            cells: [
              <div key="c">
                <div className="font-mono text-xs font-semibold">{x.code}</div>
                <div className="text-[11px] text-muted-foreground">{x.kind}</div>
              </div>,
              <div key="t" className="max-w-[320px]">
                <div className="text-sm">{x.title}</div>
                <div className="text-[11px] text-muted-foreground">{clip(x.description || "", 80)}</div>
              </div>,
              safeUrl(x.url) ? (
                <a key="u" href={safeUrl(x.url)} target="_blank" rel="noreferrer noopener" className="text-xs text-primary hover:underline break-all">{clip(x.url, 50)}</a>
              ) : (
                <span key="u" className="text-xs text-muted-foreground">—</span>
              ),
              <span key="o" className="text-xs">{x.sortOrder}</span>,
              <Badge key="p" variant={x.published ? "success" : "secondary"}>{x.published ? "Công bố" : "Nội bộ"}</Badge>,
            ],
          }))}
        />
      </main>
    </>
  );
}
