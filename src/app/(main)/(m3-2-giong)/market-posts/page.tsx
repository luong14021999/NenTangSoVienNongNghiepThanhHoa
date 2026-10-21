import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { clip } from "@/components/common/stat-grid";
import { varietyStore } from "@/lib/modules/m3/data/breeding";
import { marketPostStore } from "@/lib/modules/m3/data/genomics";
import { POST_KINDS } from "@/lib/modules/m3/genomics";
import { byId, refOptions } from "@/lib/platform/ref-options";
import { fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Thông tin thị trường giống" };

/** M3.2.8 – giới thiệu nguồn giống, tiến bộ kỹ thuật, mô hình hiệu quả, thông tin thị trường, hỗ trợ sau cung ứng. */
export default async function MarketPostsPage() {
  const [all, varieties] = await Promise.all([marketPostStore.list(), varietyStore.list()]);
  const varietyById = byId(varieties);
  const fields: CrudField[] = [
    { name: "code", label: "Mã tin", required: true, mono: true, placeholder: "VD: TT-GIONG-001" },
    { name: "kind", label: "Loại tin", type: "select", options: [...POST_KINDS] },
    { name: "title", label: "Tiêu đề", required: true, full: true },
    { name: "varietyId", label: "Giống liên quan", type: "select", options: refOptions(varieties, (v) => `${v.code} · ${v.name}`) },
    { name: "area", label: "Địa phương" },
    { name: "priceNote", label: "Thông tin giá (nếu có)", placeholder: "VD: giá giống lúa xác nhận 25.000–28.000 đ/kg" },
    { name: "publishedAt", label: "Ngày đăng", type: "date" },
    { name: "isPublic", label: "Đăng trên cổng công khai", type: "bool", boolLabels: ["Công bố", "Nội bộ"], defaultValue: 0 },
    { name: "summary", label: "Tóm tắt", type: "textarea" },
    { name: "content", label: "Nội dung", type: "textarea" },
    { name: "note", label: "Ghi chú nội bộ", type: "textarea" },
  ];
  return (
    <>
      <Header title="Thông tin thị trường & dịch vụ kỹ thuật giống" description="Giới thiệu nguồn giống, tiến bộ kỹ thuật, mô hình hiệu quả, giá – thị trường, hỗ trợ sau cung ứng; tin Công bố hiện trên cổng" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <Link href="/portal/giong" target="_blank" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"><ExternalLink className="w-3.5 h-3.5" />Xem trang Giống trên cổng công khai</Link>
        <CrudTableCard
          title="Danh sách tin"
          description="Giống muốn giới thiệu trên cổng: bật “Giới thiệu trên cổng công khai” ở hồ sơ giống"
          endpoint="/api/market-posts"
          entity="market-posts"
          editFields={fields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/market-posts" title="Thêm tin" fields={fields} addLabel="Thêm tin" />}
          headers={["Mã / ngày", "Loại", "Tiêu đề", "Giống · địa phương", "Công bố"]}
          emptyText="Chưa có tin"
          rows={[...all].sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || "")).map((p) => ({
            id: p.id,
            label: p.title,
            initial: p,
            cells: [
              <div key="c"><div className="font-mono text-xs font-semibold">{p.code}</div><div className="text-[11px] text-muted-foreground">{fmtDateVN(p.publishedAt)}</div></div>,
              <Badge key="k" variant="outline">{p.kind}</Badge>,
              <div key="t" className="max-w-[320px]"><div className="text-sm">{p.title}</div><div className="text-[11px] text-muted-foreground">{clip(p.summary || "", 90)}</div></div>,
              <span key="v" className="text-xs">{[varietyById.get(p.varietyId)?.name, p.area].filter(Boolean).join(" · ") || "—"}</span>,
              p.isPublic ? (
                <Link key="p" href={`/portal/giong/${encodeURIComponent(p.code)}`} target="_blank"><Badge variant="success">Công bố</Badge></Link>
              ) : (
                <Badge key="p" variant="secondary">Nội bộ</Badge>
              ),
            ],
          }))}
        />
      </main>
    </>
  );
}
