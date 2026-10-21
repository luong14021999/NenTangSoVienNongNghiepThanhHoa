// M4.4 Báo cáo thống kê KH&CN định kỳ (dùng chung cho trang và file CSV).
import { fieldTrialStore, researchTaskStore, researcherStore, taskExpenseStore } from "@/lib/modules/m4/data/research";
import { ACCEPTANCE_RESULTS, ACTIVE_TASK, DEGREES, RESEARCH_FIELDS, TASK_LEVELS, TASK_STATUSES } from "@/lib/modules/m4/research";

const countBy = <T,>(items: T[], key: (x: T) => string, order: readonly string[]) => {
  const m = new Map<string, number>(order.map((k) => [k, 0]));
  for (const x of items) {
    const k = key(x) || "Chưa phân loại";
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].filter(([, n]) => n > 0).map(([label, n]) => ({ label, n }));
};

/** Nhiệm vụ có thời gian thực hiện giao với năm `year` (hoặc chưa đặt ngày). */
const inYear = (t: { startAt: string; endAt: string }, year: number) =>
  (!t.startAt || Number(t.startAt.slice(0, 4)) <= year) && (!t.endAt || Number(t.endAt.slice(0, 4)) >= year);

export async function researchStats(year: number) {
  const [tasks, researchers, expenses, trials] = await Promise.all([
    researchTaskStore.list(),
    researcherStore.list(),
    taskExpenseStore.list(),
    fieldTrialStore.list(),
  ]);
  const y = String(year);
  const yearTasks = tasks.filter((t) => inYear(t, year) && t.status !== "Không phê duyệt");
  const approvedInYear = tasks.filter((t) => (t.approvedAt || "").startsWith(y));
  const acceptedInYear = tasks.filter((t) => t.status === "Đã nghiệm thu" && (t.acceptedAt || "").startsWith(y));
  const spentInYear = expenses.filter((e) => (e.spentAt || "").startsWith(y));
  const working = researchers.filter((r) => r.status !== "Nghỉ hưu / chuyển công tác");

  return {
    year,
    totals: {
      tasksInYear: yearTasks.length,
      active: tasks.filter((t) => ACTIVE_TASK.includes(t.status)).length,
      approvedInYear: approvedInYear.length,
      acceptedInYear: acceptedInYear.length,
      budgetApprovedInYear: approvedInYear.reduce((s, t) => s + (t.budgetState || 0) + (t.budgetOther || 0), 0),
      stateBudgetApprovedInYear: approvedInYear.reduce((s, t) => s + (t.budgetState || 0), 0),
      spentInYear: spentInYear.reduce((s, e) => s + (e.amount || 0), 0),
      researchers: working.length,
      fieldTrialsInYear: trials.filter((x) => (x.startAt || "").startsWith(y)).length,
    },
    byLevel: countBy(yearTasks, (t) => t.level, TASK_LEVELS),
    byField: countBy(yearTasks, (t) => t.field, RESEARCH_FIELDS),
    byStatus: countBy(tasks, (t) => t.status, TASK_STATUSES),
    byAcceptance: countBy(acceptedInYear, (t) => t.acceptanceResult, ACCEPTANCE_RESULTS),
    byDegree: countBy(working, (r) => r.degree, DEGREES),
    spentByCategory: [...spentInYear.reduce((m, e) => m.set(e.category, (m.get(e.category) ?? 0) + e.amount), new Map<string, number>())].map(([label, amount]) => ({ label, amount })),
  };
}
