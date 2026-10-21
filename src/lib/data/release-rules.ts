// Bộ quy tắc kiểm soát trước phát hành có phiên bản (M2.5): soạn → phê duyệt (người khác) → hiệu lực.
import { dbQuery, isDbConfigured } from "@/lib/db";
import { DEFAULT_RULES, evaluateRelease, type CheckResult, type ReleaseRules } from "@/lib/release-checks";
import { accreditedTests, testNoOf } from "@/lib/accreditation";
import { equipmentStore } from "./equipment";
import { chemicalsStore } from "./chemicals";
import { isActiveAuthorization, methodValidationStore, testAuthorizationStore } from "./competence";
import { qcChartStore, qcPointStore } from "./quality";
import type { ResultRow } from "./results";
import type { QCPoint } from "@/lib/mock-data";

export type RuleSet = {
  id: string;
  version: number;
  status: "Dự thảo" | "Hiệu lực" | "Hết hiệu lực";
  rules: ReleaseRules;
  changeNote: string;
  createdBy: string;
  createdAt: string;
  approvedBy: string;
  approvedAt: string;
};

const COLS = "id, version, status, rules, change_note, created_by, created_at, approved_by, approved_at";
const toSet = (r: Record<string, unknown>): RuleSet => ({
  id: r.id as string,
  version: Number(r.version),
  status: r.status as RuleSet["status"],
  rules: { ...DEFAULT_RULES, ...(r.rules as Partial<ReleaseRules>) },
  changeNote: (r.change_note as string) ?? "",
  createdBy: (r.created_by as string) ?? "",
  createdAt: (r.created_at as string) ?? "",
  approvedBy: (r.approved_by as string) ?? "",
  approvedAt: (r.approved_at as string) ?? "",
});

/** Danh sách phiên bản; lần đầu tự tạo phiên bản 1 = bộ mặc định. */
export async function listRuleSets(): Promise<RuleSet[]> {
  if (!isDbConfigured()) return [];
  let rows = await dbQuery(`select ${COLS} from public.release_rule_sets order by version desc`);
  if (rows.length === 0) {
    await dbQuery(
      `insert into public.release_rule_sets (version, status, rules, change_note, created_by, approved_by, approved_at)
       values (1, 'Hiệu lực', $1::jsonb, $2, 'Hệ thống', 'Hệ thống (mặc định ban đầu)', now())
       on conflict (version) do nothing`,
      [JSON.stringify(DEFAULT_RULES), "Bộ quy tắc mặc định khi triển khai – PTN cần xem xét và ban hành phiên bản của mình"],
    );
    rows = await dbQuery(`select ${COLS} from public.release_rule_sets order by version desc`);
  }
  return rows.map(toSet);
}

export async function activeRuleSet(): Promise<RuleSet | null> {
  return (await listRuleSets()).find((s) => s.status === "Hiệu lực") ?? null;
}

export async function createDraft(rules: ReleaseRules, note: string, actor: string) {
  const sets = await listRuleSets();
  if (sets.some((s) => s.status === "Dự thảo")) return { error: "Đang có 1 dự thảo chờ phê duyệt – phê duyệt hoặc huỷ trước" } as const;
  const version = (sets[0]?.version ?? 0) + 1;
  const [row] = await dbQuery(
    `insert into public.release_rule_sets (version, status, rules, change_note, created_by)
     values ($1, 'Dự thảo', $2::jsonb, $3, $4) returning ${COLS}`,
    [version, JSON.stringify(rules), note, actor],
  );
  return { set: toSet(row) } as const;
}

/** Phê duyệt dự thảo: người phê duyệt ≠ người soạn; phiên bản đang hiệu lực chuyển Hết hiệu lực. */
export async function approveDraft(id: string, actor: string) {
  const [row] = await dbQuery(`select ${COLS} from public.release_rule_sets where id = $1`, [id]);
  if (!row) return { error: "Không tìm thấy phiên bản" } as const;
  const set = toSet(row);
  if (set.status !== "Dự thảo") return { error: "Chỉ phê duyệt được bản Dự thảo" } as const;
  if (set.createdBy === actor) return { error: "Người phê duyệt phải khác người soạn thảo" } as const;
  await dbQuery(`update public.release_rule_sets set status = 'Hết hiệu lực' where status = 'Hiệu lực'`);
  const [updated] = await dbQuery(
    `update public.release_rule_sets set status = 'Hiệu lực', approved_by = $2, approved_at = now()
     where id = $1 returning ${COLS}`,
    [id, actor],
  );
  return { set: toSet(updated) } as const;
}

export async function discardDraft(id: string) {
  const rows = await dbQuery(
    `delete from public.release_rule_sets where id = $1 and status = 'Dự thảo' returning version`,
    [id],
  );
  return rows.length > 0;
}

// ── Nạp dữ liệu & đánh giá 1 kết quả ────────────────────────────────

/** Nạp toàn bộ dữ liệu tham chiếu 1 lần, trả về hàm đánh giá dùng cho nhiều kết quả. */
export async function loadReleaseContext() {
  const [set, equipment, auths, validations, charts, points, chemicals] = await Promise.all([
    activeRuleSet(),
    equipmentStore.list(),
    testAuthorizationStore.list(),
    methodValidationStore.list(),
    qcChartStore.list(),
    qcPointStore.list(),
    chemicalsStore.list(),
  ]);
  const rules = set?.rules ?? DEFAULT_RULES;
  const ctx = {
    equipment: equipment.map((e) => ({ code: e.code, name: e.name, status: e.status, nextCalibration: e.nextCalibration })),
    authorizations: auths.map((a) => ({ staffName: a.staffName, testNo: testNoOf(a.testLabel), role: a.role, active: isActiveAuthorization(a) })),
    validations: validations.map((v) => ({ testNo: testNoOf(v.testLabel), conclusion: v.conclusion })),
    qcCharts: charts.map((c) => ({ ...c, points: points.filter((p) => p.chartId === c.id) as QCPoint[] })),
    chemicals: chemicals.map((c) => ({ name: c.name, expiry: c.expiry })),
  };
  const evaluate = (r: ResultRow, approverName?: string): CheckResult[] =>
    evaluateRelease(rules, {
      ...ctx,
      approverName,
      test: accreditedTests.find((t) => t.no === testNoOf(r.criterion)),
      result: {
        criterion: r.criterion,
        unit: r.unit,
        mean: r.mean,
        rsd: r.rsd,
        uncertainty: r.uncertainty,
        matrixSpikeRecovery: r.matrixSpikeRecovery,
        instrumentCode: r.instrument.code,
        referenceMaterial: r.referenceMaterial,
        technician: r.technician,
        startedAt: r.startedAt,
        decisionRuleType: r.decisionRuleType,
        conclusion: r.conclusion,
        calcDetail: r.calcDetail,
      },
    });
  /** Thiết bị bị khóa (quá hạn hiệu chuẩn / không Hoạt động) khi quy tắc thiết bị đang ở mức Chặn. */
  const lockedEquipment = new Set(
    rules.equipmentCalibration === "Chặn"
      ? ctx.equipment
          .filter((e) => e.status !== "Hoạt động" || (e.nextCalibration && e.nextCalibration.slice(0, 10) < new Date().toISOString().slice(0, 10)))
          .map((e) => e.code)
      : [],
  );
  return { rules, version: set?.version ?? 0, evaluate, lockedEquipment };
}
