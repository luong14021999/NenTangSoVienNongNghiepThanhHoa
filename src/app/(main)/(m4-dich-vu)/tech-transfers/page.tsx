import { Repeat, FileSignature, PackageCheck, Banknote } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { StatGrid, clip } from "@/components/common/stat-grid";
import { ipAssetStore, partnerStore, techTransferStore } from "@/lib/modules/m4/data/knowledge";
import { researchTaskStore } from "@/lib/modules/m4/data/research";
import { TRANSFER_FORMS, TRANSFER_STATUSES } from "@/lib/modules/m4/knowledge";
import { fmtVND } from "@/lib/modules/m4/finance";
import { byId, refOptions } from "@/lib/platform/ref-options";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Chuyển giao công nghệ" };

export default async function TechTransfersPage() {
  const [all, partners, ips, tasks] = await Promise.all([techTransferStore.list(), partnerStore.list(), ipAssetStore.list(), researchTaskStore.list()]);
  const partnerById = byId(partners);
  const ipById = byId(ips);
  const taskById = byId(tasks);
  const fields: CrudField[] = [
    { name: "code", label: "Mã", required: true, mono: true, placeholder: "VD: CG-2026-001" },
    { name: "form", label: "Hình thức", type: "select", options: [...TRANSFER_FORMS] },
    { name: "title", label: "Công nghệ / quy trình / giống chuyển giao", required: true, full: true },
    { name: "partnerId", label: "Bên nhận", type: "select", options: refOptions(partners, (p) => `${p.code} · ${p.name}`) },
    { name: "ipAssetId", label: "Văn bằng liên quan", type: "select", options: refOptions(ips, (x) => `${x.code} · ${x.title}`) },
    { name: "taskId", label: "Kết quả của nhiệm vụ", type: "select", options: refOptions(tasks, (t) => `${t.code} · ${t.title}`) },
    { name: "status", label: "Tình trạng", type: "select", options: [...TRANSFER_STATUSES] },
    { name: "contractNo", label: "Số hợp đồng", mono: true },
    { name: "signedAt", label: "Ngày ký", type: "date" },
    { name: "value", label: "Giá trị (VND)", type: "number" },
    { name: "handoverAt", label: "Ngày biên bản bàn giao", type: "date" },
    { name: "handoverNote", label: "Nội dung biên bản bàn giao (hồ sơ, mẫu, đào tạo…)", type: "textarea" },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];
  const year = todayISO().slice(0, 4);
  const signed = all.filter((x) => x.status !== "Đang đàm phán" && x.status !== "Hủy");

  return (
    <>
      <Header title="Chuyển giao công nghệ" description="Hợp đồng và biên bản bàn giao kết quả KH&CN cho doanh nghiệp, hợp tác xã, địa phương" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Hợp đồng chuyển giao", value: all.length, icon: Repeat, accent: "bg-blue-50 text-blue-600" },
            { label: "Đã ký", value: signed.length, icon: FileSignature, accent: "bg-violet-50 text-violet-600" },
            { label: "Đã bàn giao", value: all.filter((x) => x.handoverAt).length, icon: PackageCheck, accent: "bg-emerald-50 text-emerald-700" },
            { label: `Giá trị ký ${year}`, value: fmtVND(signed.filter((x) => (x.signedAt || "").startsWith(year)).reduce((s, x) => s + x.value, 0)), icon: Banknote, accent: "bg-amber-50 text-amber-600" },
          ]}
        />
        <CrudTableCard
          title="Danh sách chuyển giao"
          description="Lớp tập huấn kèm chuyển giao quản lý ở trang Tập huấn"
          endpoint="/api/tech-transfers"
          entity="tech-transfers"
          editFields={fields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/tech-transfers" title="Thêm chuyển giao" fields={fields} addLabel="Thêm chuyển giao" />}
          headers={["Mã / hình thức", "Nội dung", "Bên nhận", "Hợp đồng", "Bàn giao", "Tình trạng"]}
          emptyText="Chưa có chuyển giao nào"
          rows={[...all].sort((a, b) => b.code.localeCompare(a.code)).map((x) => ({
            id: x.id,
            label: x.code,
            initial: x,
            cells: [
              <div key="c"><div className="font-mono text-xs font-semibold">{x.code}</div><div className="text-[11px] text-muted-foreground">{x.form}</div></div>,
              <div key="t" className="max-w-[300px]">
                <div className="text-sm">{x.title}</div>
                <div className="text-[11px] text-muted-foreground font-mono">{[taskById.get(x.taskId)?.code, ipById.get(x.ipAssetId)?.code].filter(Boolean).join(" · ")}</div>
              </div>,
              <span key="p" className="text-xs">{partnerById.get(x.partnerId)?.name ?? "—"}</span>,
              <div key="h" className="text-xs">{x.contractNo || "—"}<div className="text-muted-foreground">{fmtDateVN(x.signedAt)}{x.value ? ` · ${fmtVND(x.value)}` : ""}</div></div>,
              <div key="b" className="text-xs">{fmtDateVN(x.handoverAt) || "—"}<div className="text-muted-foreground">{clip(x.handoverNote || "", 60)}</div></div>,
              <Badge key="s" variant={x.status === "Đã bàn giao" || x.status === "Đã thanh lý" ? "success" : x.status === "Hủy" ? "destructive" : x.status === "Đã ký" ? "default" : "warning"}>{x.status}</Badge>,
            ],
          }))}
        />
      </main>
    </>
  );
}
