import { Building, Handshake, AlertTriangle, Globe2 } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { StatGrid, clip } from "@/components/common/stat-grid";
import { agreementStore, partnerStore, techTransferStore } from "@/lib/modules/m4/data/knowledge";
import { safeUrl } from "@/lib/modules/m4/data/portal";
import { AGREEMENT_KINDS, AGREEMENT_STATUSES, PARTNER_KINDS, agreementExpiryAlert } from "@/lib/modules/m4/knowledge";
import { byId, refOptions } from "@/lib/platform/ref-options";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Đối tác & hợp tác" };

const PARTNER_FIELDS: CrudField[] = [
  { name: "code", label: "Mã đối tác", required: true, mono: true, placeholder: "VD: DT-001" },
  { name: "kind", label: "Loại", type: "select", options: [...PARTNER_KINDS] },
  { name: "name", label: "Tên đối tác", required: true, full: true },
  { name: "country", label: "Quốc gia" },
  { name: "contact", label: "Người liên hệ" },
  { name: "email", label: "Email" },
  { name: "phone", label: "Điện thoại" },
  { name: "address", label: "Địa chỉ", full: true },
  { name: "note", label: "Ghi chú", type: "textarea" },
];

export default async function PartnersPage() {
  const [partners, agreements, transfers] = await Promise.all([partnerStore.list(), agreementStore.list(), techTransferStore.list()]);
  const partnerById = byId(partners);
  const today = todayISO();
  const agreementFields: CrudField[] = [
    { name: "code", label: "Số thỏa thuận", required: true, mono: true, placeholder: "VD: TTHT-2026-001" },
    { name: "kind", label: "Loại", type: "select", options: [...AGREEMENT_KINDS] },
    { name: "partnerId", label: "Đối tác", type: "select", required: true, options: refOptions(partners, (p) => `${p.code} · ${p.name}`) },
    { name: "status", label: "Tình trạng", type: "select", options: [...AGREEMENT_STATUSES] },
    { name: "title", label: "Tên thỏa thuận / chương trình", required: true, full: true },
    { name: "signedAt", label: "Ngày ký", type: "date" },
    { name: "validUntil", label: "Hiệu lực đến", type: "date" },
    { name: "url", label: "Văn bản (https://…)", full: true },
    { name: "scope", label: "Phạm vi, nội dung hợp tác", type: "textarea" },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];
  const active = agreements.filter((a) => a.status === "Đang hiệu lực");

  return (
    <>
      <Header title="Đối tác & hợp tác" description="Đối tác trong và ngoài nước, biên bản ghi nhớ, thỏa thuận và chương trình hợp tác" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Đối tác", value: partners.length, icon: Building, accent: "bg-blue-50 text-blue-600" },
            { label: "Quốc tế", value: partners.filter((p) => p.country && p.country !== "Việt Nam").length, icon: Globe2, accent: "bg-violet-50 text-violet-600" },
            { label: "Thỏa thuận đang hiệu lực", value: active.length, icon: Handshake, accent: "bg-emerald-50 text-emerald-700" },
            { label: "Sắp / đã quá hạn", value: agreements.filter((a) => agreementExpiryAlert(a, today)).length, icon: AlertTriangle, accent: "bg-rose-50 text-rose-600", hint: "trong 60 ngày" },
          ]}
        />
        <CrudTableCard
          title="Thỏa thuận & chương trình hợp tác"
          description="Thỏa thuận đang hiệu lực được cảnh báo trước 60 ngày khi sắp hết hạn"
          endpoint="/api/agreements"
          entity="agreements"
          editFields={agreementFields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/agreements" title="Thêm thỏa thuận" fields={agreementFields} addLabel="Thêm thỏa thuận" />}
          headers={["Số / loại", "Thỏa thuận", "Đối tác", "Hiệu lực", "Tình trạng"]}
          emptyText="Chưa có thỏa thuận nào"
          rows={[...agreements].sort((a, b) => b.code.localeCompare(a.code)).map((a) => {
            const alert = agreementExpiryAlert(a, today);
            const url = safeUrl(a.url);
            return {
              id: a.id,
              label: a.code,
              initial: a,
              cells: [
                <div key="c"><div className="font-mono text-xs font-semibold">{a.code}</div><div className="text-[11px] text-muted-foreground">{a.kind}</div></div>,
                <div key="t" className="max-w-[320px]"><div className="text-sm">{a.title}</div><div className="text-[11px] text-muted-foreground">{clip(a.scope || "", 90)}</div>{url && <a href={url} target="_blank" rel="noreferrer noopener" className="text-[11px] text-primary hover:underline">Văn bản</a>}</div>,
                <span key="p" className="text-xs">{partnerById.get(a.partnerId)?.name ?? "—"}</span>,
                <div key="v" className="text-xs whitespace-nowrap">{fmtDateVN(a.signedAt) || "—"} → {fmtDateVN(a.validUntil) || "…"}{alert && <div className="text-rose-600 font-medium">{alert.kind} {alert.days} ngày</div>}</div>,
                <Badge key="s" variant={a.status === "Đang hiệu lực" ? "success" : a.status === "Đang đàm phán" ? "warning" : "secondary"}>{a.status}</Badge>,
              ],
            };
          })}
        />
        <CrudTableCard
          title="Danh sách đối tác"
          description="Đối tác hợp tác nghiên cứu và nhận chuyển giao (khách hàng dịch vụ quản lý ở trang Khách hàng)"
          endpoint="/api/partners"
          entity="partners"
          editFields={PARTNER_FIELDS}
          addNode={<EntityFormDialog mode="add" endpoint="/api/partners" title="Thêm đối tác" fields={PARTNER_FIELDS} addLabel="Thêm đối tác" />}
          headers={["Mã / loại", "Đối tác", "Liên hệ", "Thỏa thuận", "Chuyển giao"]}
          emptyText="Chưa có đối tác nào"
          rows={[...partners].sort((a, b) => a.name.localeCompare(b.name, "vi")).map((p) => ({
            id: p.id,
            label: p.name,
            initial: p,
            cells: [
              <div key="c"><div className="font-mono text-xs font-semibold">{p.code}</div><div className="text-[11px] text-muted-foreground">{p.kind}</div></div>,
              <div key="n"><div className="text-sm">{p.name}</div><div className="text-[11px] text-muted-foreground">{[p.country, p.address].filter(Boolean).join(" · ")}</div></div>,
              <div key="l" className="text-xs">{p.contact || "—"}<div className="text-muted-foreground">{[p.email, p.phone].filter(Boolean).join(" · ")}</div></div>,
              <span key="a" className="text-xs">{agreements.filter((a) => a.partnerId === p.id).length}</span>,
              <span key="t" className="text-xs">{transfers.filter((t) => t.partnerId === p.id).length}</span>,
            ],
          }))}
        />
      </main>
    </>
  );
}
