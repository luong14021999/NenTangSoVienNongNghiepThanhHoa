import { researchTaskStore, type ResearchTask } from "@/lib/modules/m4/data/research";
import { createRoute, listRoute } from "@/lib/platform/api/crud";
import { nextDocCode } from "@/lib/modules/m4/finance";
import { validateTask } from "@/lib/modules/m4/research";
import { todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

export const GET = listRoute(researchTaskStore);

const DEFAULTS: Omit<ResearchTask, "id"> = {
  code: "",
  title: "",
  kind: "Đề tài",
  level: "Cấp cơ sở",
  field: "",
  leaderId: "",
  hostUnit: "",
  objectives: "",
  keywords: "",
  startAt: "",
  endAt: "",
  budgetState: 0,
  budgetOther: 0,
  status: "Đề xuất",
  approvalNo: "",
  approvedAt: "",
  acceptanceResult: "",
  acceptedAt: "",
  outputs: "",
  nationalRef: "",
  note: "",
};

const create = createRoute<ResearchTask>(
  researchTaskStore,
  (b) => ({ ...DEFAULTS, ...b, id: "", nationalRef: "" }) as ResearchTask,
  (b) => (!b.title ? "Thiếu tên nhiệm vụ" : validateTask({ ...DEFAULTS, ...b } as ResearchTask)),
);

/** Để trống mã → tự đánh NV-<năm>-<số kế tiếp>. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (!String(body.code ?? "").trim()) {
    const codes = (await researchTaskStore.list()).map((t) => t.code);
    body.code = nextDocCode("NV", Number(todayISO().slice(0, 4)), codes);
  }
  const headers = new Headers(req.headers);
  headers.delete("content-length");
  return create(new Request(req.url, { method: "POST", headers, body: JSON.stringify(body) }));
}
