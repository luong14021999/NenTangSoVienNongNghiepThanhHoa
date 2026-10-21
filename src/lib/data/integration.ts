// M1.3 Tích hợp: khóa API cho hệ thống bên ngoài, nhật ký gọi API, thông điệp LGSP / NDXP.
import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { generateApiKey, hasScope, hashApiKey, isApiKeyFormat, keyPrefix, withinRateLimit, type ApiScope } from "@/lib/integration/api-keys";

export type ApiClient = {
  id: string;
  name: string;
  organization: string;
  keyPrefix: string;
  scopes: string[];
  rateLimit: number;
  active: boolean;
  expiresAt: string;
  note: string;
  createdBy: string;
  createdAt: string;
  lastUsedAt: string;
  calls24h: number;
};

export async function listApiClients(): Promise<ApiClient[]> {
  const rows = await dbQuery(
    `select c.*, (select count(*)::int from public.api_calls a where a.client_id = c.id and a.at > now() - interval '24 hours') calls_24h
     from public.api_clients c order by c.created_at desc`,
  );
  return rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    organization: (r.organization as string) ?? "",
    keyPrefix: r.key_prefix as string,
    scopes: (r.scopes as string[]) ?? [],
    rateLimit: Number(r.rate_limit ?? 0),
    active: Boolean(r.active),
    expiresAt: (r.expires_at as string) ?? "",
    note: (r.note as string) ?? "",
    createdBy: (r.created_by as string) ?? "",
    createdAt: (r.created_at as string) ?? "",
    lastUsedAt: (r.last_used_at as string) ?? "",
    calls24h: Number(r.calls_24h ?? 0),
  }));
}

/** Tạo khóa – trả về khóa đầy đủ đúng một lần. */
export async function createApiClient(c: { name: string; organization: string; scopes: string[]; rateLimit: number; expiresAt: string; note: string }, actor: string) {
  const key = generateApiKey();
  const [r] = await dbQuery(
    `insert into public.api_clients (name, organization, key_prefix, key_hash, scopes, rate_limit, expires_at, note, created_by)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning id`,
    [c.name, c.organization, keyPrefix(key), hashApiKey(key), c.scopes, c.rateLimit, c.expiresAt || null, c.note, actor],
  );
  return { id: r.id as string, key };
}

export async function updateApiClient(id: string, patch: { active?: boolean; scopes?: string[]; rateLimit?: number; expiresAt?: string; note?: string }) {
  const [r] = await dbQuery(
    `update public.api_clients set
       active = coalesce($2, active), scopes = coalesce($3, scopes), rate_limit = coalesce($4, rate_limit),
       expires_at = case when $5::text is null then expires_at else nullif($5, '')::date end, note = coalesce($6, note)
     where id = $1 returning id, name`,
    [id, patch.active ?? null, patch.scopes ?? null, patch.rateLimit ?? null, patch.expiresAt ?? null, patch.note ?? null],
  );
  return r ?? null;
}

export async function deleteApiClient(id: string) {
  const r = await dbQuery(`delete from public.api_clients where id = $1 returning name`, [id]);
  return r[0] ?? null;
}

export async function listApiCalls(limit = 100) {
  const rows = await dbQuery(`select * from public.api_calls order by at desc limit $1`, [limit]);
  return rows.map((r) => ({
    id: String(r.id),
    at: r.at as string,
    clientName: (r.client_name as string) ?? "",
    method: r.method as string,
    path: r.path as string,
    status: Number(r.status),
    ms: Number(r.ms),
    ip: (r.ip as string) ?? "",
  }));
}

type ApiCtx = { client: { id: string; name: string; scopes: string[] } };

/**
 * Bọc route /api/v1: kiểm tra khóa (X-API-Key hoặc Authorization: Bearer), hiệu lực, hạn,
 * phạm vi, giới hạn tần suất; ghi nhật ký gọi API kể cả khi bị từ chối.
 */
export function withApiKey<P>(scope: ApiScope, handler: (req: Request, ctx: ApiCtx, params: P) => Promise<Response>) {
  return async (req: Request, routeCtx: { params: Promise<P> }) => {
    const t0 = Date.now();
    const url = new URL(req.url);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
    const raw = (req.headers.get("x-api-key") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "").trim();
    let client: { id: string; name: string; scopes: string[]; rate_limit: number } | null = null;
    const log = async (status: number) => {
      await dbQuery(
        `insert into public.api_calls (client_id, client_name, method, path, status, ms, ip) values ($1, $2, $3, $4, $5, $6, $7)`,
        [client?.id ?? null, client?.name ?? (raw ? `${raw.slice(0, 10)}…` : "(không có khóa)"), req.method, url.pathname + url.search, status, Date.now() - t0, ip],
      ).catch(() => undefined);
    };
    const deny = async (status: number, error: string, code: string) => {
      await log(status);
      return NextResponse.json({ error, code }, { status });
    };
    if (!raw) return deny(401, "Thiếu khóa API (header X-API-Key)", "API_KEY_MISSING");
    if (!isApiKeyFormat(raw)) return deny(401, "Khóa API không hợp lệ", "API_KEY_INVALID");
    const [r] = await dbQuery(
      `select id, name, scopes, rate_limit, active, expires_at from public.api_clients where key_hash = $1`,
      [hashApiKey(raw)],
    );
    if (!r) return deny(401, "Khóa API không hợp lệ", "API_KEY_INVALID");
    client = { id: r.id as string, name: r.name as string, scopes: (r.scopes as string[]) ?? [], rate_limit: Number(r.rate_limit ?? 0) };
    if (!r.active) return deny(403, "Khóa API đã bị vô hiệu hóa", "API_KEY_DISABLED");
    if (r.expires_at && String(r.expires_at) < new Date().toISOString().slice(0, 10)) return deny(403, "Khóa API đã hết hạn", "API_KEY_EXPIRED");
    if (!hasScope(client.scopes, scope)) return deny(403, `Khóa API không có phạm vi ${scope}`, "SCOPE_DENIED");
    const [cnt] = await dbQuery(`select count(*)::int n from public.api_calls where client_id = $1 and at > now() - interval '1 minute'`, [client.id]);
    if (!withinRateLimit(Number(cnt?.n ?? 0), client.rate_limit)) return deny(429, `Vượt giới hạn ${client.rate_limit} lượt / phút`, "RATE_LIMITED");

    let res: Response;
    try {
      res = await handler(req, { client }, await routeCtx.params);
    } catch (e) {
      console.error("[api/v1]", e);
      res = NextResponse.json({ error: "Lỗi máy chủ", code: "SERVER_ERROR" }, { status: 500 });
    }
    await log(res.status);
    await dbQuery(`update public.api_clients set last_used_at = now() where id = $1`, [client.id]).catch(() => undefined);
    return res;
  };
}

// ── Thông điệp LGSP / NDXP ──────────────────────────────────────────
export type IntegrationMessage = {
  id: string;
  at: string;
  direction: "Gửi đi" | "Nhận về";
  channel: string;
  service: string;
  correlationId: string;
  payload: unknown;
  status: string;
  response: unknown;
  attempts: number;
  error: string;
  mode: string;
  actor: string;
};

export async function listMessages(limit = 100): Promise<IntegrationMessage[]> {
  const rows = await dbQuery(`select * from public.integration_messages order by at desc limit $1`, [limit]);
  return rows.map((r) => ({
    id: r.id as string,
    at: r.at as string,
    direction: r.direction as IntegrationMessage["direction"],
    channel: r.channel as string,
    service: r.service as string,
    correlationId: (r.correlation_id as string) ?? "",
    payload: r.payload,
    status: (r.status as string) ?? "",
    response: r.response,
    attempts: Number(r.attempts ?? 1),
    error: (r.error as string) ?? "",
    mode: (r.mode as string) ?? "",
    actor: (r.actor as string) ?? "",
  }));
}

/** Số lượt gọi API 24 giờ qua (tổng / bị từ chối hoặc lỗi). */
export async function apiCallStats() {
  const [r] = await dbQuery(
    `select count(*)::int total, count(*) filter (where status >= 400)::int denied from public.api_calls where at > now() - interval '24 hours'`,
  );
  return { total: Number(r?.total ?? 0), denied: Number(r?.denied ?? 0) };
}
