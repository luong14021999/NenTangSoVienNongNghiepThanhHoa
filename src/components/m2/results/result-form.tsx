"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { FileUp, Loader2, Pencil, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { computeResult } from "@/lib/modules/m2/calc/compute-result";
import { columnValues, defaultValueColumn, parseTable, type Table } from "@/lib/modules/m2/calc/csv";
import { parseComponents, parsePoints, parseVariables } from "@/lib/modules/m2/calc/text-formats";
import { testNoOf } from "@/lib/modules/m2/accreditation";

export type Opt = { value: string; label: string };
export type TemplateOpt = { id: string; code: string; name: string; testLabel: string; formula: string; readingVar: string; variablesText: string; useCurve: boolean; resultUnit: string };
export type CurveOpt = { id: string; code: string; testLabel: string; pointsText: string; r2: number; r2Min: number; validUntil: string; concUnit: string };
export type BudgetOpt = { id: string; code: string; name: string; testLabel: string; componentsText: string; k: number; includeRepeatability: boolean; includeCurve: boolean };

export type ResultFormValues = {
  sampleCode: string;
  testLabel: string;
  replicates: string;
  unit: string;
  uncertainty: string;
  instrumentCode: string;
  referenceMaterial: string;
  matrixSpikeRecovery: string;
  blankValue: string;
  decisionRuleId: string;
  templateId: string;
  curveId: string;
  budgetId: string;
  varValues: Record<string, string>;
};

const EMPTY: ResultFormValues = {
  sampleCode: "", testLabel: "", replicates: "", unit: "", uncertainty: "", instrumentCode: "", referenceMaterial: "",
  matrixSpikeRecovery: "", blankValue: "", decisionRuleId: "", templateId: "", curveId: "", budgetId: "", varValues: {},
};

const num = (s: string) => Number(String(s ?? "").trim().replace(",", "."));
const vn = (x: number, d = 4) => (Number.isFinite(x) ? String(Number(x.toPrecision(d))).replace(".", ",") : "—");

const inputCls = "mt-1 w-full h-9 rounded-md border border-input bg-background px-2.5 text-sm font-normal";

export function ResultForm({
  mode,
  id,
  initial,
  samples,
  tests,
  equipment,
  crms,
  rules,
  templates,
  curves,
  budgets,
  lockedNote,
}: {
  mode: "add" | "edit";
  id?: string;
  initial?: Partial<ResultFormValues>;
  samples: Opt[];
  tests: string[];
  equipment: Opt[];
  crms: string[];
  rules: Opt[];
  templates: TemplateOpt[];
  curves: CurveOpt[];
  budgets: BudgetOpt[];
  lockedNote?: string;
}) {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState<ResultFormValues>({ ...EMPTY, ...initial });
  const [file, setFile] = useState<{ name: string; content: string; table: Table } | null>(null);
  const [col, setCol] = useState(0);
  const [filterCol, setFilterCol] = useState(-1);
  const [filterVal, setFilterVal] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const set = <K extends keyof ResultFormValues>(k: K, val: ResultFormValues[K]) => setV((x) => ({ ...x, [k]: val }));
  const sameTest = (label: string) => !v.testLabel || !label || testNoOf(label) === testNoOf(v.testLabel);
  const template = templates.find((t) => t.id === v.templateId);
  const curve = curves.find((c) => c.id === v.curveId);
  const budget = budgets.find((b) => b.id === v.budgetId);
  const templateVars = useMemo(() => {
    try { return template ? parseVariables(template.variablesText) : []; } catch { return []; }
  }, [template]);

  // Xem trước: cùng thư viện tính với server (server vẫn tính lại khi lưu).
  const preview = useMemo(() => {
    const readings = v.replicates.split(/[;\s|]+/).map(num).filter(Number.isFinite);
    if (!readings.length) return null;
    try {
      return computeResult({
        readings,
        template: template && { code: template.code, formula: template.formula, readingVar: template.readingVar, variables: templateVars, useCurve: template.useCurve, resultUnit: template.resultUnit },
        varValues: Object.fromEntries(Object.entries(v.varValues).map(([k, s]) => [k, num(s)]).filter(([, n]) => Number.isFinite(n as number))),
        curve: curve && { code: curve.code, points: parsePoints(curve.pointsText), r2Min: curve.r2Min, validUntil: curve.validUntil, concUnit: curve.concUnit },
        budget: budget && { code: budget.code, components: parseComponents(budget.componentsText), k: budget.k, includeRepeatability: budget.includeRepeatability, includeCurve: budget.includeCurve },
        manualU: Number.isFinite(num(v.uncertainty)) ? num(v.uncertainty) : undefined,
      });
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, [v, template, templateVars, curve, budget]);

  function pickFile(f: File | undefined) {
    if (!f) return;
    if (f.size > 500_000) return setError("File quá lớn (tối đa ~500 KB) – xuất riêng phần dữ liệu cần dùng");
    f.text().then((content) => {
      try {
        const table = parseTable(content);
        const valueCol = defaultValueColumn(table);
        if (valueCol < 0) throw new Error("không có cột số liệu");
        setFile({ name: f.name, content, table });
        setCol(valueCol);
        setFilterCol(-1);
        setFilterVal("");
        setError(null);
      } catch (e) {
        setError(`Không đọc được file: ${(e as Error).message}`);
      }
    });
  }
  const fileValues = file ? columnValues(file.table, col, filterCol >= 0 && filterVal ? { col: filterCol, equals: filterVal } : undefined) : [];

  async function save() {
    setError(null);
    setSaving(true);
    const body = { ...v, ...(file ? { rawFile: { name: file.name, content: file.content } } : {}) };
    const res = await fetch(mode === "add" ? "/api/analysis-results" : `/api/analysis-results/${id}`, {
      method: mode === "add" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? `HTTP ${res.status}`);
      return;
    }
    toast.success(mode === "add" ? `Đã tạo ${data.item?.resultCode ?? "kết quả"}` : "Đã lưu (thay đổi được ghi lưu vết)");
    startTransition(() => {
      router.refresh();
      setOpen(false);
      setFile(null);
    });
  }

  const sel = (k: keyof ResultFormValues, label: string, opts: Opt[], extra?: string) => (
    <label className="block text-xs font-medium">
      {label}
      <select value={v[k] as string} onChange={(e) => set(k, e.target.value as never)} className={inputCls}>
        {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {extra && <span className="text-[10px] text-muted-foreground font-normal">{extra}</span>}
    </label>
  );
  const txt = (k: keyof ResultFormValues, label: string, placeholder = "", disabled = false) => (
    <label className="block text-xs font-medium">
      {label}
      <input value={v[k] as string} disabled={disabled} placeholder={placeholder} onChange={(e) => set(k, e.target.value as never)} className={`${inputCls} disabled:opacity-50`} />
    </label>
  );

  const ok = preview && !("error" in preview) ? preview : null;
  return (
    <Dialog.Root open={open} onOpenChange={(o) => { setOpen(o); if (o) { setV({ ...EMPTY, ...initial }); setError(null); setFile(null); } }}>
      <Dialog.Trigger asChild>
        {mode === "add" ? (
          <Button size="sm"><Plus /> Nhập kết quả</Button>
        ) : (
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"><Pencil className="w-3.5 h-3.5" /> Sửa</Button>
        )}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[96vw] max-w-4xl bg-card border rounded-xl shadow-xl p-5 max-h-[94vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <Dialog.Title className="text-base font-semibold">{mode === "add" ? "Nhập kết quả phân tích" : "Sửa kết quả (ghi lưu vết)"}</Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground">
                Kết quả chính thức do server tính lại khi lưu; KTV = tài khoản đang đăng nhập. {lockedNote}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent"><X className="w-4 h-4" /></button>
            </Dialog.Close>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-3">
              {sel("sampleCode", "Mẫu *", [{ value: "", label: "— chọn mẫu —" }, ...samples])}
              {sel("testLabel", "Phép thử *", [{ value: "", label: "— chọn phép thử —" }, ...tests.map((t) => ({ value: t, label: t }))])}
              <div className="grid grid-cols-2 gap-2">
                {sel("templateId", "Công thức tính", [{ value: "", label: "Không – số đọc là kết quả" }, ...templates.filter((t) => sameTest(t.testLabel)).map((t) => ({ value: t.id, label: `${t.code} · ${t.formula}` }))])}
                {sel("curveId", "Đường chuẩn", [{ value: "", label: "Không dùng" }, ...curves.filter((c) => sameTest(c.testLabel)).map((c) => ({ value: c.id, label: `${c.code} · R² ${vn(c.r2, 5)}` }))], template?.useCurve ? "công thức này cần đường chuẩn" : undefined)}
              </div>
              {templateVars.length > 0 && (
                <div className="rounded-md border p-2.5 bg-muted/30">
                  <div className="text-[11px] text-muted-foreground mb-1.5">
                    Biến công thức <span className="font-mono">{template?.formula}</span> (số đọc = <span className="font-mono">{template?.readingVar}</span>)
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {templateVars.map((tv) => (
                      <label key={tv.key} className="block text-[11px] font-medium">
                        {tv.label} {tv.unit && `(${tv.unit})`}
                        <input
                          value={v.varValues[tv.key] ?? ""}
                          placeholder={tv.default !== undefined ? String(tv.default).replace(".", ",") : "bắt buộc"}
                          onChange={(e) => set("varValues", { ...v.varValues, [tv.key]: e.target.value })}
                          className={inputCls}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <label className="block text-xs font-medium">
                Số đọc từng phép lặp * <span className="font-normal text-muted-foreground">({template?.useCurve || (curve && !template) ? "tín hiệu thiết bị" : template ? `giá trị ${template.readingVar}` : "kết quả"}; cách nhau bằng ;)</span>
                <input value={v.replicates} onChange={(e) => set("replicates", e.target.value)} placeholder="VD: 0,150; 0,152; 0,149" className={inputCls} />
              </label>
              <div className="rounded-md border border-dashed p-2.5 space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <FileUp className="w-4 h-4" /> Nhập từ file thiết bị (CSV / TXT)
                  <input type="file" accept=".csv,.txt,.tsv,text/csv,text/plain" className="text-[11px]" onChange={(e) => pickFile(e.target.files?.[0])} />
                </label>
                {file && (
                  <div className="space-y-1.5 text-[11px]">
                    <div className="text-muted-foreground">{file.name} · {file.table.rows.length} dòng · phân cách “{file.table.delimiter === "\t" ? "tab" : file.table.delimiter}” · file được lưu nguyên văn kèm SHA-256</div>
                    <div className="grid grid-cols-3 gap-2">
                      <label>Cột số liệu
                        <select value={col} onChange={(e) => setCol(Number(e.target.value))} className={inputCls}>
                          {file.table.headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                        </select>
                      </label>
                      <label>Lọc theo cột
                        <select value={filterCol} onChange={(e) => setFilterCol(Number(e.target.value))} className={inputCls}>
                          <option value={-1}>— không lọc —</option>
                          {file.table.headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                        </select>
                      </label>
                      <label>Giá trị lọc
                        <input value={filterVal} onChange={(e) => setFilterVal(e.target.value)} placeholder={v.sampleCode || "mã mẫu"} disabled={filterCol < 0} className={`${inputCls} disabled:opacity-50`} />
                      </label>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono truncate">{fileValues.slice(0, 12).map((x) => vn(x, 6)).join("; ") || "không có giá trị số"}</span>
                      <Button type="button" size="sm" variant="outline" disabled={!fileValues.length} onClick={() => set("replicates", fileValues.map((x) => String(x).replace(".", ",")).join("; "))}>
                        Dùng {fileValues.length} giá trị
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {txt("unit", "Đơn vị kết quả", template?.resultUnit || "mg/kg")}
                {sel("budgetId", "Ngân sách ĐKĐBĐ", [{ value: "", label: "Không – nhập U tay" }, ...budgets.filter((b) => sameTest(b.testLabel)).map((b) => ({ value: b.id, label: `${b.code} · k = ${b.k}` }))])}
                {txt("uncertainty", "U mở rộng (nhập tay)", budget ? "tính theo ngân sách" : "VD: 0,02", Boolean(budget))}
                {sel("decisionRuleId", "Quy tắc quyết định", [{ value: "", label: "Không – báo cáo giá trị" }, ...rules])}
              </div>
              {sel("instrumentCode", "Thiết bị", [{ value: "", label: "—" }, ...equipment], "thiết bị quá hạn hiệu chuẩn bị khóa, không hiển thị")}
              <div className="grid grid-cols-3 gap-2">
                {sel("referenceMaterial", "Mẫu chuẩn / CRM", [{ value: "", label: "—" }, ...crms.map((c) => ({ value: c, label: c }))])}
                {txt("matrixSpikeRecovery", "Độ thu hồi (%)", "98,5")}
                {txt("blankValue", "Mẫu trắng", "0,002")}
              </div>
            </div>

            <div className="rounded-lg border bg-muted/20 p-3 text-xs space-y-3 self-start lg:sticky lg:top-0">
              <div className="text-sm font-semibold">Xem trước tính toán</div>
              {!preview && <div className="text-muted-foreground">Nhập số đọc để xem kết quả</div>}
              {preview && "error" in preview && <div className="text-rose-600">⚠ {preview.error}</div>}
              {ok && (
                <>
                  <table className="w-full">
                    <thead className="text-muted-foreground"><tr className="text-left"><th className="py-0.5">Lần</th><th>Số đọc</th>{ok.calcDetail.concs && <th>Nồng độ</th>}<th>Giá trị</th></tr></thead>
                    <tbody className="font-mono">
                      {ok.calcDetail.readings.map((r, i) => (
                        <tr key={i}><td className="py-0.5 font-sans">{i + 1}</td><td>{vn(r, 6)}</td>{ok.calcDetail.concs && <td>{vn(ok.calcDetail.concs[i], 5)}</td>}<td>{vn(ok.values[i], 6)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[["x̄", vn(ok.mean)], ["SD", vn(ok.sd, 3)], ["RSD", `${vn(ok.rsd, 3)}%`], ["U", ok.U !== undefined ? vn(ok.U, 2) : "—"]].map(([k, val]) => (
                      <div key={k} className="rounded border bg-card px-2 py-1"><div className="text-muted-foreground">{k}</div><div className="font-mono font-semibold">{val}</div></div>
                    ))}
                  </div>
                  {ok.calcDetail.curve && (
                    <div className={ok.calcDetail.curve.r2 < ok.calcDetail.curve.r2Min ? "text-rose-600" : "text-muted-foreground"}>
                      Đường chuẩn {ok.calcDetail.curve.code}: R² {vn(ok.calcDetail.curve.r2, 6)} (≥ {ok.calcDetail.curve.r2Min}) · khoảng {vn(ok.calcDetail.curve.minConc)}–{vn(ok.calcDetail.curve.maxConc)} {ok.calcDetail.curve.concUnit}
                      {ok.calcDetail.concs?.some((c) => c < ok.calcDetail.curve!.minConc || c > ok.calcDetail.curve!.maxConc) && <div className="text-amber-700">⚠ có số đọc ngoài khoảng đường chuẩn (ngoại suy)</div>}
                    </div>
                  )}
                  {ok.uncertaintyDetail && (
                    <div>
                      <div className="font-medium mb-0.5">Ngân sách {ok.uncertaintyDetail.budgetCode}</div>
                      <table className="w-full">
                        <tbody>
                          {ok.uncertaintyDetail.rows.map((r) => (
                            <tr key={r.name}><td className="py-0.5">{r.name} <span className="text-muted-foreground">({r.type})</span></td><td className="text-right font-mono">{vn(r.relU, 3)}%</td></tr>
                          ))}
                          <tr className="border-t font-medium"><td className="py-0.5">u_c tương đối</td><td className="text-right font-mono">{vn(ok.uncertaintyDetail.relUc, 3)}%</td></tr>
                          <tr className="font-medium"><td>U = {ok.uncertaintyDetail.k} · u_c · x̄</td><td className="text-right font-mono">{vn(ok.uncertaintyDetail.U, 2)}</td></tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {error && <div className="mt-3 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded px-2.5 py-2">{error}</div>}
          <div className="flex justify-end gap-2 pt-3 mt-3 border-t">
            <Dialog.Close asChild><Button variant="outline" type="button">Hủy</Button></Dialog.Close>
            <Button onClick={save} disabled={saving || pending || !v.sampleCode || !v.testLabel || !v.replicates.trim()}>
              {(saving || pending) && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "add" ? "Lưu kết quả" : "Lưu thay đổi"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
