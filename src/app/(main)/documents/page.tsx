import Link from "next/link";
import { FileStack, FileCheck2, CalendarClock, FilePen } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import {
  EntityFormDialog,
  type CrudField,
} from "@/components/crud/entity-form-dialog";
import { EntitySearchInput } from "@/components/crud/search-input";
import { StatGrid } from "@/components/qms/stat-grid";
import {
  DOC_STATUSES,
  DOC_TYPES,
  qmsDocumentStore,
  type QmsDocument,
} from "@/lib/data/qms";
import { daysUntil, fmtDateVN } from "@/lib/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kiểm soát tài liệu" };

const FIELDS: CrudField[] = [
  { name: "code", label: "Mã tài liệu", required: true, mono: true, placeholder: "VD: AEMD-QT-01" },
  { name: "docType", label: "Loại tài liệu", type: "select", options: [...DOC_TYPES] },
  { name: "title", label: "Tên tài liệu", required: true, full: true },
  { name: "version", label: "Lần ban hành / soát xét", placeholder: "VD: 03/2026" },
  { name: "status", label: "Trạng thái", type: "select", options: [...DOC_STATUSES] },
  { name: "issuedAt", label: "Ngày ban hành", type: "date" },
  { name: "reviewDue", label: "Hạn soát xét định kỳ", type: "date" },
  { name: "owner", label: "Người biên soạn / quản lý" },
  { name: "approvedBy", label: "Người phê duyệt" },
  { name: "distribution", label: "Nơi lưu / phân phối", full: true },
  { name: "note", label: "Ghi chú", type: "textarea" },
];

const statusVariant: Record<QmsDocument["status"], "success" | "warning" | "secondary"> = {
  "Hiệu lực": "success",
  "Dự thảo": "warning",
  "Hết hiệu lực": "secondary",
};

const REVIEW_WARN_DAYS = 60;

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q = "", type = "" } = await searchParams;
  const all = (await qmsDocumentStore.list()).sort(
    (a, b) => a.docType.localeCompare(b.docType) || a.code.localeCompare(b.code),
  );
  const query = q.trim().toLowerCase();
  const docs = all.filter(
    (d) =>
      (!type || d.docType === type) &&
      (!query ||
        `${d.code} ${d.title} ${d.owner} ${d.approvedBy}`.toLowerCase().includes(query)),
  );

  const active = all.filter((d) => d.status === "Hiệu lực");
  const reviewDue = active.filter((d) => daysUntil(d.reviewDue) <= REVIEW_WARN_DAYS);

  return (
    <>
      <Header
        title="Kiểm soát tài liệu"
        description="ISO/IEC 17025:2017 §8.3 – danh mục tài liệu nội bộ và bên ngoài: phiên bản, phê duyệt, soát xét, thu hồi"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Tổng tài liệu", value: all.length, icon: FileStack, accent: "bg-emerald-50 text-emerald-700" },
            { label: "Đang hiệu lực", value: active.length, icon: FileCheck2, accent: "bg-blue-50 text-blue-600" },
            { label: "Cần soát xét", value: reviewDue.length, icon: CalendarClock, accent: "bg-rose-50 text-rose-600", hint: `quá hạn hoặc ≤ ${REVIEW_WARN_DAYS} ngày` },
            { label: "Dự thảo", value: all.filter((d) => d.status === "Dự thảo").length, icon: FilePen, accent: "bg-amber-50 text-amber-600", hint: "chờ phê duyệt" },
          ]}
        />

        <div className="flex flex-wrap items-center gap-2">
          {["", ...DOC_TYPES].map((t) => {
            const n = t ? all.filter((d) => d.docType === t).length : all.length;
            const href = `/documents?${new URLSearchParams({ ...(q && { q }), ...(t && { type: t }) })}`;
            return (
              <Link
                key={t || "all"}
                href={href}
                className={`h-8 px-3 inline-flex items-center rounded-full border text-xs font-medium ${
                  type === t ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"
                }`}
              >
                {t || "Tất cả"} <span className="ml-1.5 opacity-70">{n}</span>
              </Link>
            );
          })}
          <div className="ml-auto w-full sm:w-auto">
            <EntitySearchInput basePath="/documents" placeholder="Tìm mã, tên, người duyệt…" />
          </div>
        </div>

        <CrudTableCard
          title="Danh mục tài liệu"
          description="Tài liệu chỉ được dùng khi ở trạng thái Hiệu lực; tài liệu lỗi thời chuyển sang Hết hiệu lực để nhận biết"
          endpoint="/api/qms-documents"
          entity="qms-documents"
          editFields={FIELDS}
          addNode={
            <EntityFormDialog
              mode="add"
              endpoint="/api/qms-documents"
              title="Thêm tài liệu"
              fields={FIELDS}
              addLabel="Thêm tài liệu"
            />
          }
          headers={["Mã / loại", "Tên tài liệu", "Phiên bản", "Ban hành / phê duyệt", "Soát xét", "Trạng thái"]}
          emptyText={query || type ? "Không có tài liệu phù hợp" : "Chưa có tài liệu nào"}
          rows={docs.map((d) => {
            const days = daysUntil(d.reviewDue);
            const warn = d.status === "Hiệu lực" && days <= REVIEW_WARN_DAYS;
            return {
              id: d.id,
              label: d.code,
              initial: d,
              cells: [
                <div key="c">
                  <div className="font-mono text-xs font-semibold">{d.code}</div>
                  <div className="text-[11px] text-muted-foreground">{d.docType}</div>
                </div>,
                <div key="t" className="max-w-[360px]">
                  <div className="text-sm font-medium leading-snug">{d.title}</div>
                  {d.distribution && (
                    <div className="text-[11px] text-muted-foreground">Lưu tại: {d.distribution}</div>
                  )}
                </div>,
                <span key="v" className="text-sm">{d.version || "—"}</span>,
                <div key="i" className="text-xs">
                  <div>{fmtDateVN(d.issuedAt) || "—"}</div>
                  <div className="text-muted-foreground">{d.approvedBy || "chưa ghi người duyệt"}</div>
                </div>,
                <div key="r" className={`text-xs ${warn ? "text-rose-600 font-medium" : ""}`}>
                  {d.reviewDue ? fmtDateVN(d.reviewDue) : "—"}
                  {warn && <div>{days < 0 ? `quá hạn ${-days} ngày` : `còn ${days} ngày`}</div>}
                </div>,
                <Badge key="s" variant={statusVariant[d.status] ?? "secondary"}>{d.status}</Badge>,
              ],
            };
          })}
        />
      </main>
    </>
  );
}
