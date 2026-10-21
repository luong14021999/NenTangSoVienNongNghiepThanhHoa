import Link from "next/link";
import { Inbox, Loader, CheckCircle2, Globe, ExternalLink } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { EntitySearchInput } from "@/components/crud/search-input";
import { StatGrid, clip } from "@/components/common/stat-grid";
import { getCustomers } from "@/lib/modules/m4/data/customers";
import { quotationStore } from "@/lib/modules/m4/data/sales";
import { serviceRequestStore, type ServiceRequest } from "@/lib/modules/m4/data/portal";
import { REQUEST_CHANNELS, REQUEST_KINDS, REQUEST_STATUSES, TARGET_UNITS } from "@/lib/modules/m4/portal";
import { byId, matches, refOptions } from "@/lib/platform/ref-options";
import { fmtDateTimeVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Yêu cầu dịch vụ" };

const statusVariant: Record<ServiceRequest["status"], "destructive" | "warning" | "default" | "secondary" | "success" | "outline"> = {
  "Mới tiếp nhận": "destructive",
  "Đang xử lý": "warning",
  "Đã báo giá": "default",
  "Đang thực hiện": "default",
  "Hoàn thành": "success",
  "Từ chối": "outline",
};

/** Mã ngắn của đơn vị xử lý để làm bộ lọc: "M2 – Phòng…" → "M2". */
const unitKey = (u: string) => u.split(" – ")[0];

export default async function ServiceRequestsPage({ searchParams }: { searchParams: Promise<{ q?: string; unit?: string }> }) {
  const { q = "", unit = "" } = await searchParams;
  const [all, customers, quotations] = await Promise.all([serviceRequestStore.list(), getCustomers(), quotationStore.list()]);
  const customerById = byId(customers);
  const quotationById = byId(quotations);

  const contactFields: CrudField[] = [
    { name: "kind", label: "Loại dịch vụ", type: "select", options: [...REQUEST_KINDS] },
    { name: "channel", label: "Kênh tiếp nhận", type: "select", options: [...REQUEST_CHANNELS] },
    { name: "contactName", label: "Người liên hệ", required: true },
    { name: "phone", label: "Điện thoại", required: true },
    { name: "orgName", label: "Tổ chức / hộ gia đình" },
    { name: "email", label: "Email" },
    { name: "address", label: "Địa chỉ", full: true },
    { name: "sampleCount", label: "Số mẫu / số lượng", type: "number" },
    { name: "description", label: "Nội dung yêu cầu", type: "textarea", required: true },
  ];
  const handlingFields: CrudField[] = [
    { name: "targetUnit", label: "Đơn vị xử lý", type: "select", options: [...TARGET_UNITS] },
    { name: "status", label: "Trạng thái", type: "select", options: [...REQUEST_STATUSES] },
    { name: "handler", label: "Cán bộ xử lý" },
    { name: "customerId", label: "Khách hàng (hồ sơ)", type: "select", options: refOptions(customers, (c) => `${c.code} · ${c.name}`) },
    { name: "quotationId", label: "Báo giá", type: "select", options: refOptions(quotations, (x) => `${x.code} · ${x.title}`) },
    { name: "publicNote", label: "Phản hồi cho khách (hiện khi khách tra cứu)", type: "textarea" },
    { name: "note", label: "Ghi chú nội bộ (không công bố)", type: "textarea" },
  ];
  const editFields = [...handlingFields, ...contactFields];

  const query = q.trim().toLowerCase();
  const sorted = [...all].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  const rows = sorted.filter(
    (x) => (!unit || unitKey(x.targetUnit) === unit) && matches(query, x.code, x.contactName, x.orgName, x.phone, x.description),
  );
  const open = all.filter((x) => x.status !== "Hoàn thành" && x.status !== "Từ chối");

  return (
    <>
      <Header title="Yêu cầu dịch vụ" description="Yêu cầu từ cổng trực tuyến và tiếp nhận trực tiếp – tự định tuyến đến M2, M3 hoặc bộ phận tư vấn" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Mới tiếp nhận", value: all.filter((x) => x.status === "Mới tiếp nhận").length, icon: Inbox, accent: "bg-rose-50 text-rose-600", hint: "cần phân công xử lý" },
            { label: "Đang xử lý", value: open.length, icon: Loader, accent: "bg-amber-50 text-amber-600", hint: "chưa hoàn thành / từ chối" },
            { label: "Hoàn thành", value: all.filter((x) => x.status === "Hoàn thành").length, icon: CheckCircle2, accent: "bg-emerald-50 text-emerald-700" },
            { label: "Qua cổng trực tuyến", value: all.filter((x) => x.channel === "Trực tuyến").length, icon: Globe, accent: "bg-blue-50 text-blue-600" },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          {["", ...TARGET_UNITS.map(unitKey)].map((u) => (
            <Link
              key={u || "all"}
              href={`/service-requests?${new URLSearchParams({ ...(q && { q }), ...(u && { unit: u }) })}`}
              className={`h-8 px-3 inline-flex items-center rounded-full border text-xs font-medium ${
                unit === u ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"
              }`}
            >
              {u || "Tất cả"}{" "}
              <span className="ml-1.5 opacity-70">{(u ? open.filter((x) => unitKey(x.targetUnit) === u) : open).length}</span>
            </Link>
          ))}
          <Link href="/portal" target="_blank" className="h-8 px-3 inline-flex items-center gap-1.5 rounded-full border text-xs hover:bg-accent">
            <ExternalLink className="w-3.5 h-3.5" /> Xem cổng công khai
          </Link>
          <div className="ml-auto w-full sm:w-auto">
            <EntitySearchInput basePath="/service-requests" placeholder="Tìm mã, người liên hệ, điện thoại, nội dung…" />
          </div>
        </div>
        <CrudTableCard
          title="Danh sách yêu cầu"
          description="Số trên bộ lọc là yêu cầu chưa xử lý xong của từng đơn vị. Mục “Phản hồi cho khách” hiện khi khách tra cứu bằng mã + số điện thoại"
          endpoint="/api/service-requests"
          entity="service-requests"
          editFields={editFields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/service-requests" title="Nhập yêu cầu (trực tiếp / điện thoại)" fields={contactFields} addLabel="Nhập yêu cầu" />}
          headers={["Mã / thời điểm", "Khách", "Nội dung", "Đơn vị xử lý", "Liên kết", "Trạng thái"]}
          emptyText={query || unit ? "Không có yêu cầu phù hợp" : "Chưa có yêu cầu nào"}
          rows={rows.map((x) => ({
            id: x.id,
            label: x.code,
            initial: x,
            cells: [
              <div key="c">
                <div className="font-mono text-xs font-semibold">{x.code}</div>
                <div className="text-[11px] text-muted-foreground">{fmtDateTimeVN(x.createdAt)} · {x.channel}</div>
              </div>,
              <div key="k" className="text-xs">
                <div className="text-sm font-medium">{x.contactName}</div>
                <div className="text-muted-foreground">{[x.orgName, x.phone].filter(Boolean).join(" · ")}</div>
              </div>,
              <div key="d" className="max-w-[300px]">
                <div className="text-[11px] text-muted-foreground">{x.kind}{x.sampleCount > 0 && ` · ${x.sampleCount} mẫu`}</div>
                <div className="text-xs">{clip(x.description, 100)}</div>
              </div>,
              <div key="u" className="text-xs">
                {x.targetUnit}
                {x.handler && <div className="text-muted-foreground">{x.handler}</div>}
              </div>,
              <div key="l" className="text-[11px] font-mono text-muted-foreground">
                {customerById.get(x.customerId)?.code ?? ""}
                {quotationById.get(x.quotationId) && <div>{quotationById.get(x.quotationId)!.code}</div>}
                {!x.customerId && !x.quotationId && "—"}
              </div>,
              <Badge key="s" variant={statusVariant[x.status] ?? "secondary"}>{x.status}</Badge>,
            ],
          }))}
        />
      </main>
    </>
  );
}
