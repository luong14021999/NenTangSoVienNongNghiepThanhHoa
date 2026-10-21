import { ShieldCheck, FileClock, BadgeCheck, AlertTriangle } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { EntitySearchInput } from "@/components/crud/search-input";
import { StatGrid } from "@/components/common/stat-grid";
import { ipAssetStore } from "@/lib/modules/m4/data/knowledge";
import { researchTaskStore } from "@/lib/modules/m4/data/research";
import { IP_KINDS, IP_STATUSES, ipExpiryAlert } from "@/lib/modules/m4/knowledge";
import { byId, matches, refOptions } from "@/lib/platform/ref-options";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tài sản trí tuệ" };

const statusVariant: Record<string, "secondary" | "warning" | "default" | "success" | "destructive"> = {
  "Đang soạn hồ sơ": "secondary",
  "Đã nộp đơn": "default",
  "Đang thẩm định": "warning",
  "Được cấp bằng": "success",
  "Bị từ chối": "destructive",
  "Hết hiệu lực": "secondary",
};

export default async function IpAssetsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const [all, tasks] = await Promise.all([ipAssetStore.list(), researchTaskStore.list()]);
  const taskById = byId(tasks);
  const today = todayISO();
  const fields: CrudField[] = [
    { name: "code", label: "Mã", required: true, mono: true, placeholder: "VD: SHTT-001" },
    { name: "kind", label: "Loại", type: "select", options: [...IP_KINDS] },
    { name: "title", label: "Tên đối tượng bảo hộ", required: true, full: true },
    { name: "owner", label: "Chủ sở hữu" },
    { name: "authors", label: "Tác giả" },
    { name: "taskId", label: "Kết quả của nhiệm vụ", type: "select", options: refOptions(tasks, (t) => `${t.code} · ${t.title}`) },
    { name: "status", label: "Tình trạng", type: "select", options: [...IP_STATUSES] },
    { name: "applicationNo", label: "Số đơn", mono: true },
    { name: "filedAt", label: "Ngày nộp đơn", type: "date" },
    { name: "grantNo", label: "Số văn bằng", mono: true },
    { name: "grantedAt", label: "Ngày cấp", type: "date" },
    { name: "expiresAt", label: "Hiệu lực đến", type: "date" },
    { name: "note", label: "Ghi chú (phí duy trì, gia hạn…)", type: "textarea" },
  ];
  const query = q.trim().toLowerCase();
  const rows = [...all].sort((a, b) => b.code.localeCompare(a.code)).filter((x) => matches(query, x.code, x.title, x.authors, x.grantNo, x.applicationNo));
  const granted = all.filter((x) => x.status === "Được cấp bằng");

  return (
    <>
      <Header title="Tài sản trí tuệ" description="Văn bằng bảo hộ: sáng chế, giải pháp hữu ích, giống cây trồng, nhãn hiệu, chỉ dẫn địa lý, quyền tác giả" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Tài sản trí tuệ", value: all.length, icon: ShieldCheck, accent: "bg-blue-50 text-blue-600" },
            { label: "Đang xử lý đơn", value: all.filter((x) => x.status === "Đã nộp đơn" || x.status === "Đang thẩm định").length, icon: FileClock, accent: "bg-amber-50 text-amber-600" },
            { label: "Văn bằng còn hiệu lực", value: granted.filter((x) => !x.expiresAt || x.expiresAt >= today).length, icon: BadgeCheck, accent: "bg-emerald-50 text-emerald-700" },
            { label: "Sắp / đã hết hiệu lực", value: all.filter((x) => ipExpiryAlert(x, today)).length, icon: AlertTriangle, accent: "bg-rose-50 text-rose-600", hint: "trong 180 ngày" },
          ]}
        />
        <div className="flex justify-end">
          <EntitySearchInput basePath="/ip-assets" placeholder="Tìm mã, tên, tác giả, số đơn, số văn bằng…" />
        </div>
        <CrudTableCard
          title="Danh sách tài sản trí tuệ"
          description="Văn bằng sắp hết hiệu lực được cảnh báo trước 180 ngày để gia hạn / nộp phí duy trì"
          endpoint="/api/ip-assets"
          entity="ip-assets"
          editFields={fields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/ip-assets" title="Thêm tài sản trí tuệ" fields={fields} addLabel="Thêm" />}
          headers={["Mã / loại", "Đối tượng", "Đơn", "Văn bằng", "Nhiệm vụ", "Tình trạng"]}
          emptyText={query ? "Không có mục phù hợp" : "Chưa có tài sản trí tuệ"}
          rows={rows.map((x) => {
            const alert = ipExpiryAlert(x, today);
            return {
              id: x.id,
              label: x.code,
              initial: x,
              cells: [
                <div key="c"><div className="font-mono text-xs font-semibold">{x.code}</div><div className="text-[11px] text-muted-foreground">{x.kind}</div></div>,
                <div key="t" className="max-w-[300px]"><div className="text-sm">{x.title}</div><div className="text-[11px] text-muted-foreground">{[x.authors, x.owner].filter(Boolean).join(" · ")}</div></div>,
                <div key="a" className="text-xs">{x.applicationNo || "—"}<div className="text-muted-foreground">{fmtDateVN(x.filedAt)}</div></div>,
                <div key="g" className="text-xs">
                  {x.grantNo || "—"}
                  {x.grantedAt && <div className="text-muted-foreground">{fmtDateVN(x.grantedAt)} → {fmtDateVN(x.expiresAt) || "…"}</div>}
                  {alert && <div className="text-rose-600 font-medium">{alert.kind} {alert.days} ngày</div>}
                </div>,
                <span key="n" className="text-xs font-mono">{taskById.get(x.taskId)?.code ?? "—"}</span>,
                <Badge key="s" variant={statusVariant[x.status] ?? "secondary"}>{x.status}</Badge>,
              ],
            };
          })}
        />
      </main>
    </>
  );
}
