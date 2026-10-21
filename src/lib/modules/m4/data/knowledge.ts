// M4.5 Kho tri thức & dữ liệu nền, M4.6 Tài sản trí tuệ, hợp tác, chuyển giao (schema m4).
import { columnsMapping, createEntityStore } from "@/lib/platform/data/factory";
import { dbQuery, isDbConfigured } from "@/lib/platform/db";
import { normalizeVi } from "@/lib/modules/m4/research";
import type { ObservationRow } from "@/lib/modules/m4/knowledge";

// ── Kho tri thức ────────────────────────────────────────────────────
export type KnowledgeItem = {
  id: string;
  code: string;
  kind: string;
  title: string;
  abstract: string;
  content: string;
  keywords: string;
  externalAuthors: string;
  taskId: string;
  fieldTrialId: string;
  publishedAt: string;
  source: string;
  url: string;
  isPublic: boolean;
  note: string;
};

// Cột `search` (tsvector) do Postgres tự sinh – không đọc / ghi qua store.
export const knowledgeStore = createEntityStore<KnowledgeItem>(
  "knowledge-items",
  [],
  columnsMapping<KnowledgeItem>("m4.knowledge_items", {
    code: "text",
    kind: "text",
    title: "text",
    abstract: "text",
    content: "text",
    keywords: "text",
    externalAuthors: "text",
    taskId: "ref",
    fieldTrialId: "ref",
    publishedAt: "date",
    source: "text",
    url: "text",
    isPublic: "bool",
    note: "text",
  }),
);

export type KnowledgeAuthor = { id: string; itemId: string; researcherId: string; role: string };
export const knowledgeAuthorStore = createEntityStore<KnowledgeAuthor>(
  "knowledge-authors",
  [],
  columnsMapping<KnowledgeAuthor>("m4.knowledge_authors", { itemId: "ref", researcherId: "ref", role: "text" }),
);

export type KnowledgeHit = { id: string; code: string; kind: string; title: string; abstract: string; keywords: string; publishedAt: string; source: string; url: string; isPublic: boolean; rank: number };

/**
 * Tìm kiếm toàn văn (không phân biệt dấu, hỗ trợ "cụm từ", -loại trừ, OR).
 * `publicOnly`: chỉ tài liệu công bố – dùng cho cổng công khai (không trả nội dung toàn văn, ghi chú nội bộ).
 */
export async function searchKnowledge(q: string, opts: { publicOnly?: boolean; kind?: string; limit?: number } = {}): Promise<KnowledgeHit[]> {
  const query = q.trim().slice(0, 200);
  const limit = Math.min(100, opts.limit ?? 50);
  const map = (r: Record<string, unknown>): KnowledgeHit => ({
    id: r.id as string,
    code: r.code as string,
    kind: (r.kind as string) ?? "",
    title: r.title as string,
    abstract: (r.abstract as string) ?? "",
    keywords: (r.keywords as string) ?? "",
    publishedAt: (r.published_at as string) ?? "",
    source: (r.source as string) ?? "",
    url: (r.url as string) ?? "",
    isPublic: Boolean(r.is_public),
    rank: Number(r.rank ?? 0),
  });
  if (isDbConfigured()) {
    try {
      const cols = "id, code, kind, title, abstract, keywords, published_at, source, url, is_public";
      const filters = ["($2::text = '' or kind = $2)", ...(opts.publicOnly ? ["is_public"] : [])].join(" and ");
      const rows = query
        ? await dbQuery(
            `select ${cols}, ts_rank(search, q) rank
             from m4.knowledge_items, websearch_to_tsquery('simple', m4.f_unaccent($1)) q
             where search @@ q and ${filters}
             order by rank desc, published_at desc nulls last limit ${limit}`,
            [query, opts.kind ?? ""],
          )
        : await dbQuery(
            `select ${cols}, 0 rank from m4.knowledge_items where ${filters.replaceAll("$2", "$1")}
             order by published_at desc nulls last, code desc limit ${limit}`,
            [opts.kind ?? ""],
          );
      return rows.map(map);
    } catch (e) {
      console.error("[knowledge] search:", (e as Error).message);
    }
  }
  // Dự phòng (chưa có DB / lỗi): lọc theo từ đã bỏ dấu.
  const words = normalizeVi(query).split(" ").filter(Boolean);
  return (await knowledgeStore.list())
    .filter((k) => (!opts.publicOnly || k.isPublic) && (!opts.kind || k.kind === opts.kind))
    .filter((k) => {
      const hay = normalizeVi(`${k.title} ${k.keywords} ${k.abstract} ${k.content} ${k.externalAuthors} ${k.source}`);
      return words.every((w) => hay.includes(w));
    })
    .slice(0, limit)
    .map((k) => ({ ...k, rank: 0 }));
}

/** 1 tài liệu công bố cho cổng công khai – chỉ các trường được phép. */
export async function publicKnowledgeItem(code: string) {
  if (!isDbConfigured() || !code || code.length > 64) return null;
  const [r] = await dbQuery(
    `select code, kind, title, abstract, keywords, external_authors, published_at, source, url
     from m4.knowledge_items where code = $1 and is_public`,
    [code],
  ).catch(() => []);
  return (r as Record<string, string> | undefined) ?? null;
}

// ── Dữ liệu nền ─────────────────────────────────────────────────────
export type BaseDataset = {
  id: string;
  code: string;
  theme: string;
  title: string;
  area: string;
  period: string;
  source: string;
  updateFrequency: string;
  url: string;
  description: string;
  note: string;
};
export const baseDatasetStore = createEntityStore<BaseDataset>(
  "base-datasets",
  [],
  columnsMapping<BaseDataset>("m4.base_datasets", {
    code: "text",
    theme: "text",
    title: "text",
    area: "text",
    period: "text",
    source: "text",
    updateFrequency: "text",
    url: "text",
    description: "text",
    note: "text",
  }),
);

export async function observationsOf(datasetId: string) {
  if (!isDbConfigured()) return [];
  const rows = await dbQuery(
    `select id, location, period, indicator, value, unit from m4.base_observations
     where dataset_id = $1 order by indicator, location, period`,
    [datasetId],
  ).catch(() => []);
  return rows as { id: string; location: string; period: string; indicator: string; value: number | null; unit: string }[];
}

/** Ghi hàng loạt số liệu; trùng (địa bàn, kỳ, chỉ tiêu) → cập nhật giá trị. */
export async function upsertObservations(datasetId: string, rows: ObservationRow[]) {
  if (!rows.length) return 0;
  const res = await dbQuery(
    `insert into m4.base_observations (dataset_id, location, period, indicator, value, unit)
     select $1, x.location, x.period, x.indicator, x.value, x.unit
     from json_to_recordset($2::json) as x(location text, period text, indicator text, value double precision, unit text)
     on conflict (dataset_id, location, period, indicator) do update set value = excluded.value, unit = excluded.unit
     returning id`,
    [datasetId, JSON.stringify(rows)],
  );
  return res.length;
}

export async function countObservations() {
  if (!isDbConfigured()) return new Map<string, number>();
  const rows = await dbQuery(`select dataset_id, count(*)::int n from m4.base_observations group by 1`).catch(() => []);
  return new Map(rows.map((r) => [r.dataset_id as string, Number(r.n)]));
}

// ── Tài sản trí tuệ, hợp tác, chuyển giao, tập huấn ─────────────────
export type IpAsset = {
  id: string;
  code: string;
  kind: string;
  title: string;
  owner: string;
  authors: string;
  taskId: string;
  applicationNo: string;
  filedAt: string;
  grantNo: string;
  grantedAt: string;
  expiresAt: string;
  status: string;
  note: string;
};
export const ipAssetStore = createEntityStore<IpAsset>(
  "ip-assets",
  [],
  columnsMapping<IpAsset>("m4.ip_assets", {
    code: "text",
    kind: "text",
    title: "text",
    owner: "text",
    authors: "text",
    taskId: "ref",
    applicationNo: "text",
    filedAt: "date",
    grantNo: "text",
    grantedAt: "date",
    expiresAt: "date",
    status: "text",
    note: "text",
  }),
);

export type Partner = { id: string; code: string; name: string; kind: string; country: string; contact: string; email: string; phone: string; address: string; note: string };
export const partnerStore = createEntityStore<Partner>(
  "partners",
  [],
  columnsMapping<Partner>("m4.partners", {
    code: "text",
    name: "text",
    kind: "text",
    country: "text",
    contact: "text",
    email: "text",
    phone: "text",
    address: "text",
    note: "text",
  }),
);

export type Agreement = { id: string; code: string; partnerId: string; kind: string; title: string; scope: string; signedAt: string; validUntil: string; status: string; url: string; note: string };
export const agreementStore = createEntityStore<Agreement>(
  "agreements",
  [],
  columnsMapping<Agreement>("m4.agreements", {
    code: "text",
    partnerId: "ref",
    kind: "text",
    title: "text",
    scope: "text",
    signedAt: "date",
    validUntil: "date",
    status: "text",
    url: "text",
    note: "text",
  }),
);

export type TechTransfer = {
  id: string;
  code: string;
  title: string;
  partnerId: string;
  ipAssetId: string;
  taskId: string;
  form: string;
  contractNo: string;
  signedAt: string;
  value: number;
  handoverAt: string;
  handoverNote: string;
  status: string;
  note: string;
};
export const techTransferStore = createEntityStore<TechTransfer>(
  "tech-transfers",
  [],
  columnsMapping<TechTransfer>("m4.tech_transfers", {
    code: "text",
    title: "text",
    partnerId: "ref",
    ipAssetId: "ref",
    taskId: "ref",
    form: "text",
    contractNo: "text",
    signedAt: "date",
    value: "number",
    handoverAt: "date",
    handoverNote: "text",
    status: "text",
    note: "text",
  }),
);

export type Training = {
  id: string;
  code: string;
  title: string;
  transferId: string;
  mode: string;
  audience: string;
  startAt: string;
  endAt: string;
  venue: string;
  equipment: string;
  meetingUrl: string;
  trainer: string;
  planned: number;
  attended: number;
  materialsUrl: string;
  status: string;
  note: string;
};
export const trainingStore = createEntityStore<Training>(
  "trainings",
  [],
  columnsMapping<Training>("m4.trainings", {
    code: "text",
    title: "text",
    transferId: "ref",
    mode: "text",
    audience: "text",
    startAt: "date",
    endAt: "date",
    venue: "text",
    equipment: "text",
    meetingUrl: "text",
    trainer: "text",
    planned: "number",
    attended: "number",
    materialsUrl: "text",
    status: "text",
    note: "text",
  }),
);
