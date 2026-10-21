import { Sigma, Calculator, Gauge, FlaskConical } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import {
  EntityFormDialog,
  type CrudField,
} from "@/components/crud/entity-form-dialog";
import { StatGrid, clip } from "@/components/common/stat-grid";
import { budgetStore, calcTemplateStore } from "@/lib/modules/m2/data/calc-methods";
import { parseComponents, parseVariables } from "@/lib/modules/m2/calc/text-formats";
import { testLabels } from "@/lib/modules/m2/accreditation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Công thức tính & độ không đảm bảo đo" };

const TEMPLATE_FIELDS: CrudField[] = [
  { name: "code", label: "Mã công thức", required: true, mono: true, placeholder: "VD: CT-PB-DAT" },
  { name: "status", label: "Trạng thái", type: "select", options: ["Hiệu lực", "Ngừng sử dụng"] },
  { name: "name", label: "Tên công thức", required: true, full: true, placeholder: "VD: Pb trong đất – quy đổi từ dịch chiết" },
  { name: "testLabel", label: "Phép thử áp dụng", type: "select", options: ["", ...testLabels], full: true },
  { name: "formula", label: "Công thức (dùng ; ngăn cách đối số hàm, dấu phẩy là thập phân)", required: true, full: true, mono: true, placeholder: "C * V * f / m" },
  { name: "readingVar", label: "Biến nhận số đọc từng phép lặp", required: true, mono: true, placeholder: "C" },
  { name: "resultUnit", label: "Đơn vị kết quả", placeholder: "mg/kg" },
  { name: "useCurve", label: "Số đọc là tín hiệu → quy đổi qua đường chuẩn", type: "select", options: [{ value: "false", label: "Không – số đọc là nồng độ" }, { value: "true", label: "Có – cần chọn đường chuẩn" }], full: true },
  { name: "variablesText", label: "Biến khác – mỗi dòng: tên | nhãn | đơn vị | giá trị mặc định", type: "textarea", placeholder: "V | Thể tích định mức | mL | 50\nf | Hệ số pha loãng | | 1\nm | Khối lượng mẫu | g" },
  { name: "note", label: "Ghi chú / căn cứ (điều khoản phương pháp)", type: "textarea" },
];

const BUDGET_FIELDS: CrudField[] = [
  { name: "code", label: "Mã ngân sách", required: true, mono: true, placeholder: "VD: NS-PB-DAT" },
  { name: "k", label: "Hệ số phủ k", type: "number", defaultValue: 2 },
  { name: "name", label: "Tên", required: true, full: true },
  { name: "testLabel", label: "Phép thử áp dụng", type: "select", options: ["", ...testLabels], full: true },
  { name: "componentsText", label: "Thành phần – mỗi dòng: tên | A/B | u chuẩn tương đối % | nguồn", type: "textarea", placeholder: "CRM Pb | B | 1,0 | Giấy chứng nhận CRM\nBình định mức 50 mL | B | 0,12 | Dung sai cấp A /√3\nĐộ thu hồi | A | 1,5 | Hồ sơ xác nhận PP" },
  { name: "includeRepeatability", label: "Thêm độ lặp lại từ phép lặp (RSD/√n)", type: "select", options: [{ value: "true", label: "Có" }, { value: "false", label: "Không" }] },
  { name: "includeCurve", label: "Thêm nội suy đường chuẩn s(x0)/x0", type: "select", options: [{ value: "false", label: "Không" }, { value: "true", label: "Có" }] },
  { name: "note", label: "Ghi chú / căn cứ (EURACHEM, hồ sơ xác nhận…)", type: "textarea" },
];

const boolText = <T extends Record<string, unknown>>(o: T, keys: (keyof T)[]) =>
  ({ ...o, ...Object.fromEntries(keys.map((k) => [k, String(Boolean(o[k]))])) });

export default async function CalculationMethodsPage() {
  const [templates, budgets] = await Promise.all([calcTemplateStore.list(), budgetStore.list()]);
  templates.sort((a, b) => a.code.localeCompare(b.code));
  budgets.sort((a, b) => a.code.localeCompare(b.code));
  const relOf = (text: string) => {
    try {
      const c = parseComponents(text);
      return Math.sqrt(c.reduce((s, x) => s + x.relU ** 2, 0));
    } catch {
      return NaN;
    }
  };

  return (
    <>
      <Header
        title="Công thức tính & độ không đảm bảo đo"
        description="M2.4 công thức tính kết quả theo phương pháp · §7.6 ngân sách độ không đảm bảo đo – dùng khi nhập kết quả, mọi thay đổi được lưu vết"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Công thức hiệu lực", value: templates.filter((t) => t.status === "Hiệu lực").length, icon: Calculator, accent: "bg-emerald-50 text-emerald-700" },
            { label: "Dùng đường chuẩn", value: templates.filter((t) => t.useCurve).length, icon: FlaskConical, accent: "bg-blue-50 text-blue-600" },
            { label: "Ngân sách ĐKĐBĐ", value: budgets.length, icon: Gauge, accent: "bg-violet-50 text-violet-600" },
            { label: "Phép thử có ngân sách", value: new Set(budgets.map((b) => b.testLabel).filter(Boolean)).size, icon: Sigma, accent: "bg-amber-50 text-amber-600", hint: `/${testLabels.length} phép thử` },
          ]}
        />

        <CrudTableCard
          title="Công thức tính kết quả"
          description="Biến số đọc nhận từng giá trị phép lặp (nhập tay hoặc từ file thiết bị); các biến khác nhập 1 lần cho mỗi kết quả"
          endpoint="/api/calc-templates"
          entity="calc-templates"
          editFields={TEMPLATE_FIELDS}
          addNode={<EntityFormDialog mode="add" endpoint="/api/calc-templates" title="Thêm công thức tính" fields={TEMPLATE_FIELDS} addLabel="Thêm công thức" />}
          headers={["Mã / trạng thái", "Tên & phép thử", "Công thức", "Biến", "Đường chuẩn"]}
          emptyText="Chưa có công thức tính nào"
          rows={templates.map((t) => {
            let vars: string;
            try {
              vars = parseVariables(t.variablesText).map((v) => `${v.key}${v.unit ? ` (${v.unit})` : ""}${v.default !== undefined ? ` = ${v.default}` : ""}`).join(" · ");
            } catch (e) {
              vars = `Lỗi: ${(e as Error).message}`;
            }
            return {
              id: t.id,
              label: t.code,
              initial: boolText(t, ["useCurve"]),
              cells: [
                <div key="c">
                  <div className="font-mono text-xs font-semibold">{t.code}</div>
                  <Badge variant={t.status === "Hiệu lực" ? "success" : "secondary"} className="mt-0.5">{t.status}</Badge>
                </div>,
                <div key="n" className="max-w-[300px]">
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-[11px] text-muted-foreground">{t.testLabel ? clip(t.testLabel, 80) : "Chưa gắn phép thử"}</div>
                </div>,
                <div key="f" className="font-mono text-xs">
                  {t.formula} <span className="text-muted-foreground font-sans">→ {t.resultUnit || "—"}</span>
                  <div className="text-[11px] font-sans text-muted-foreground">số đọc: <span className="font-mono">{t.readingVar}</span></div>
                </div>,
                <span key="v" className="text-xs max-w-[220px] inline-block">{vars || "—"}</span>,
                <span key="u" className="text-xs">{t.useCurve ? "Có" : "Không"}</span>,
              ],
            };
          })}
        />

        <CrudTableCard
          title="Ngân sách độ không đảm bảo đo"
          description="u_c tương đối = √Σ u_i² (thành phần cố định + độ lặp lại + nội suy đường chuẩn); U = k · u_c · x̄"
          endpoint="/api/uncertainty-budgets"
          entity="uncertainty-budgets"
          editFields={BUDGET_FIELDS}
          addNode={<EntityFormDialog mode="add" endpoint="/api/uncertainty-budgets" title="Thêm ngân sách độ không đảm bảo đo" fields={BUDGET_FIELDS} addLabel="Thêm ngân sách" />}
          headers={["Mã", "Tên & phép thử", "Thành phần cố định", "Tự thêm", "u_c cố định"]}
          emptyText="Chưa có ngân sách nào"
          rows={budgets.map((b) => {
            let comps: { name: string; type: string; relU: number }[] = [];
            try {
              comps = parseComponents(b.componentsText);
            } catch {
              comps = [];
            }
            const rel = relOf(b.componentsText);
            return {
              id: b.id,
              label: b.code,
              initial: boolText(b, ["includeRepeatability", "includeCurve"]),
              cells: [
                <span key="c" className="font-mono text-xs font-semibold">{b.code}</span>,
                <div key="n" className="max-w-[260px]">
                  <div className="text-sm font-medium">{b.name}</div>
                  <div className="text-[11px] text-muted-foreground">{b.testLabel ? clip(b.testLabel, 80) : "Chưa gắn phép thử"}</div>
                </div>,
                <ul key="t" className="text-[11px] space-y-0.5">
                  {comps.map((c) => (
                    <li key={c.name}>{c.name} <span className="text-muted-foreground">({c.type}) {String(c.relU).replace(".", ",")}%</span></li>
                  ))}
                </ul>,
                <span key="a" className="text-xs">
                  {[b.includeRepeatability && "độ lặp lại", b.includeCurve && "đường chuẩn"].filter(Boolean).join(", ") || "—"}
                </span>,
                <span key="u" className="text-xs font-mono">{Number.isFinite(rel) ? `${rel.toFixed(2).replace(".", ",")}% · k = ${b.k}` : "lỗi định dạng"}</span>,
              ],
            };
          })}
        />
      </main>
    </>
  );
}
