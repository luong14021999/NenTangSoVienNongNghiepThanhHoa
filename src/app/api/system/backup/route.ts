import { authorize } from "@/lib/data/access";
import { logChange } from "@/lib/data/change-log";
import { exportBackup } from "@/lib/data/system";

export const dynamic = "force-dynamic";

/** Tải bản sao lưu JSON toàn bộ dữ liệu nghiệp vụ (chỉ Quản trị). */
export async function GET() {
  const gate = await authorize("admin.system");
  if (!gate.ok) return gate.response;
  const { body, sha256, tables, rows } = await exportBackup(gate.actor.name);
  await logChange({ entity: "backup", entityId: sha256.slice(0, 12), action: "Xuất sao lưu", label: `${tables} bảng · ${rows} dòng`, actor: gate.actor.name });
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="vnn-lims-backup-${stamp}.json"`,
      "X-Content-SHA256": sha256,
    },
  });
}
