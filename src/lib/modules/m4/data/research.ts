// M4.4 – dữ liệu nhiệm vụ KH&CN (schema m4) + khai thác dữ liệu phòng thử nghiệm M2.
import { columnsMapping, createEntityStore } from "@/lib/platform/data/factory";
import { dbQuery, isDbConfigured } from "@/lib/platform/db";
import type { TaskStatus } from "@/lib/modules/m4/research";

export type Researcher = {
  id: string;
  code: string;
  fullName: string;
  staffCode: string;
  birthYear: number;
  gender: string;
  degree: string;
  academicTitle: string;
  specialty: string;
  unit: string;
  email: string;
  phone: string;
  orcid: string;
  publications: string;
  awards: string;
  status: string;
  note: string;
};

export const researcherStore = createEntityStore<Researcher>(
  "researchers",
  [],
  columnsMapping<Researcher>("m4.researchers", {
    code: "text",
    fullName: "text",
    staffCode: "text",
    birthYear: "number",
    gender: "text",
    degree: "text",
    academicTitle: "text",
    specialty: "text",
    unit: "text",
    email: "text",
    phone: "text",
    orcid: "text",
    publications: "text",
    awards: "text",
    status: "text",
    note: "text",
  }),
);

export type ResearchTask = {
  id: string;
  code: string;
  title: string;
  kind: string;
  level: string;
  field: string;
  leaderId: string;
  hostUnit: string;
  objectives: string;
  keywords: string;
  startAt: string;
  endAt: string;
  budgetState: number;
  budgetOther: number;
  status: TaskStatus;
  approvalNo: string;
  approvedAt: string;
  acceptanceResult: string;
  acceptedAt: string;
  outputs: string;
  nationalRef: string;
  note: string;
};

export const researchTaskStore = createEntityStore<ResearchTask>(
  "research-tasks",
  [],
  columnsMapping<ResearchTask>("m4.research_tasks", {
    code: "text",
    title: "text",
    kind: "text",
    level: "text",
    field: "text",
    leaderId: "ref",
    hostUnit: "text",
    objectives: "text",
    keywords: "text",
    startAt: "date",
    endAt: "date",
    budgetState: "number",
    budgetOther: "number",
    status: "text",
    approvalNo: "text",
    approvedAt: "date",
    acceptanceResult: "text",
    acceptedAt: "date",
    outputs: "text",
    nationalRef: "text",
    note: "text",
  }),
);

export type TaskMember = { id: string; taskId: string; researcherId: string; role: string; workloadMonths: number; note: string };
export const taskMemberStore = createEntityStore<TaskMember>(
  "task-members",
  [],
  columnsMapping<TaskMember>("m4.task_members", { taskId: "ref", researcherId: "ref", role: "text", workloadMonths: "number", note: "text" }),
);

export type TaskMilestone = { id: string; taskId: string; title: string; deliverable: string; dueAt: string; doneAt: string; note: string };
export const taskMilestoneStore = createEntityStore<TaskMilestone>(
  "task-milestones",
  [],
  columnsMapping<TaskMilestone>("m4.task_milestones", { taskId: "ref", title: "text", deliverable: "text", dueAt: "date", doneAt: "date", note: "text" }),
);

export type TaskExpense = { id: string; taskId: string; spentAt: string; category: string; amount: number; source: string; documentNo: string; note: string };
export const taskExpenseStore = createEntityStore<TaskExpense>(
  "task-expenses",
  [],
  columnsMapping<TaskExpense>("m4.task_expenses", {
    taskId: "ref",
    spentAt: "date",
    category: "text",
    amount: "number",
    source: "text",
    documentNo: "text",
    note: "text",
  }),
);

export type TaskSample = { id: string; taskId: string; sampleCode: string; purpose: string };
export const taskSampleStore = createEntityStore<TaskSample>(
  "task-samples",
  [],
  columnsMapping<TaskSample>("m4.task_samples", { taskId: "ref", sampleCode: "text", purpose: "text" }),
);

export type ProvincialProject = {
  id: string;
  code: string;
  title: string;
  hostOrg: string;
  leader: string;
  level: string;
  field: string;
  startYear: number;
  endYear: number;
  keywords: string;
  source: string;
  status: string;
  note: string;
};
export const provincialProjectStore = createEntityStore<ProvincialProject>(
  "provincial-projects",
  [],
  columnsMapping<ProvincialProject>("m4.provincial_projects", {
    code: "text",
    title: "text",
    hostOrg: "text",
    leader: "text",
    level: "text",
    field: "text",
    startYear: "number",
    endYear: "number",
    keywords: "text",
    source: "text",
    status: "text",
    note: "text",
  }),
);

export type FieldTrial = {
  id: string;
  code: string;
  taskId: string;
  title: string;
  crop: string;
  design: string;
  treatments: number;
  replications: number;
  plotAreaM2: number;
  location: string;
  latitude: number;
  longitude: number;
  season: string;
  startAt: string;
  endAt: string;
  lead: string;
  status: string;
  results: string;
  note: string;
};
export const fieldTrialStore = createEntityStore<FieldTrial>(
  "field-trials",
  [],
  columnsMapping<FieldTrial>("m4.field_trials", {
    code: "text",
    taskId: "ref",
    title: "text",
    crop: "text",
    design: "text",
    treatments: "number",
    replications: "number",
    plotAreaM2: "number",
    location: "text",
    latitude: "number",
    longitude: "number",
    season: "text",
    startAt: "date",
    endAt: "date",
    lead: "text",
    status: "text",
    results: "text",
    note: "text",
  }),
);

/** Mẫu M2 và kết quả phân tích của các mã mẫu gắn với nhiệm vụ (giá trị chỉ có khi kết quả đã duyệt). */
export async function labDataFor(sampleCodes: string[]) {
  if (!isDbConfigured() || sampleCodes.length === 0) return [];
  const rows = await dbQuery(
    `select s.code, s.type, s.received_at, s.status,
            count(r.id)::int results,
            count(r.id) filter (where r.status = 'Đã duyệt')::int approved,
            coalesce(json_agg(json_build_object('criterion', r.criterion, 'unit', r.unit,
                       -- chỉ công bố giá trị đã qua QA/QC và Trưởng phòng duyệt
                       'mean', case when r.status = 'Đã duyệt' then r.mean end,
                       'conclusion', case when r.status = 'Đã duyệt' then r.conclusion end, 'status', r.status)
                     order by r.criterion) filter (where r.id is not null), '[]') lines
     from public.samples s
     left join public.analysis_results r on r.sample_code = s.code
     where s.code = any($1)
     group by s.code, s.type, s.received_at, s.status`,
    [sampleCodes],
  ).catch(() => []);
  return rows as {
    code: string;
    type: string;
    received_at: string;
    status: string;
    results: number;
    approved: number;
    lines: { criterion: string; unit: string; mean: number | null; conclusion: string | null; status: string }[];
  }[];
}
