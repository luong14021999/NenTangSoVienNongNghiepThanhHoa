// M4.1 / M4.3 / M4.7 – dữ liệu cổng dịch vụ (schema m4).
// Trang & API công khai CHỈ dùng các hàm public* bên dưới: mỗi hàm chọn đúng cột được phép công bố.
import { columnsMapping, createEntityStore } from "@/lib/platform/data/factory";
import { dbQuery, isDbConfigured } from "@/lib/platform/db";
import {
  RATE_LIMITS,
  REQUEST_CHANNELS,
  REQUEST_STATUSES,
  newRequestCode,
  normalizePhone,
  routeRequest,
  type PublicRequestInput,
} from "@/lib/modules/m4/portal";
import { todayISO } from "@/lib/platform/dates";

// ── Yêu cầu dịch vụ (nội bộ: CRUD đầy đủ) ───────────────────────────
export type ServiceRequest = {
  id: string;
  code: string;
  kind: string;
  targetUnit: string;
  channel: (typeof REQUEST_CHANNELS)[number];
  orgName: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  description: string;
  sampleCount: number;
  status: (typeof REQUEST_STATUSES)[number];
  handler: string;
  publicNote: string;
  customerId: string;
  quotationId: string;
  note: string;
  createdAt: string;
};

export const serviceRequestStore = createEntityStore<ServiceRequest>(
  "service-requests",
  [],
  columnsMapping<ServiceRequest>("m4.service_requests", {
    code: "text",
    kind: "text",
    targetUnit: "text",
    channel: "text",
    orgName: "text",
    contactName: "text",
    phone: "text",
    email: "text",
    address: "text",
    description: "text",
    sampleCount: "number",
    status: "text",
    handler: "text",
    publicNote: "text",
    customerId: "ref",
    quotationId: "ref",
    note: "text",
    createdAt: "date",
  }),
);

// ── Bảng giá ────────────────────────────────────────────────────────
export const PRICE_CATEGORIES = [
  "Phân tích đất",
  "Phân tích nước",
  "Phân tích phân bón",
  "Phân tích rau, quả",
  "Cây giống nuôi cấy mô",
  "Giống",
  "Tư vấn – chuyển giao",
  "Khác",
] as const;

export type PriceItem = {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  turnaround: string;
  method: string;
  vilas: boolean;
  published: boolean;
  costMaterials: number;
  costLabor: number;
  costDepreciation: number;
  costOverhead: number;
  note: string;
};

export const priceItemStore = createEntityStore<PriceItem>(
  "price-items",
  [],
  columnsMapping<PriceItem>("m4.price_items", {
    code: "text",
    name: "text",
    category: "text",
    unit: "text",
    price: "number",
    turnaround: "text",
    method: "text",
    vilas: "bool",
    published: "bool",
    costMaterials: "number",
    costLabor: "number",
    costDepreciation: "number",
    costOverhead: "number",
    note: "text",
  }),
);

// ── Nội dung công bố ────────────────────────────────────────────────
export const RESOURCE_KINDS = ["Biểu mẫu", "Năng lực", "Thông báo"] as const;

export type PublicResource = {
  id: string;
  code: string;
  kind: (typeof RESOURCE_KINDS)[number];
  title: string;
  url: string;
  description: string;
  published: boolean;
  sortOrder: number;
  note: string;
};

export const publicResourceStore = createEntityStore<PublicResource>(
  "public-resources",
  [],
  columnsMapping<PublicResource>("m4.public_resources", {
    code: "text",
    kind: "text",
    title: "text",
    url: "text",
    description: "text",
    published: "bool",
    sortOrder: "number",
    note: "text",
  }),
);

/** Chỉ cho phép liên kết http(s) trên trang công khai (chặn javascript:, data:…). */
export const safeUrl = (u: string) => (/^https?:\/\//i.test(u ?? "") ? u : "");

// ── Hàm công khai (M4.7: chỉ cột được phép công bố) ─────────────────

export async function publicPriceList() {
  if (!isDbConfigured()) return [];
  const rows = await dbQuery(
    `select code, name, category, unit, price, turnaround, method, vilas
     from m4.price_items where published order by category, code`,
  ).catch(() => []);
  return rows as { code: string; name: string; category: string; unit: string; price: number; turnaround: string; method: string; vilas: boolean }[];
}

export async function publicResources() {
  if (!isDbConfigured()) return [];
  const rows = await dbQuery(
    `select code, kind, title, url, description from m4.public_resources
     where published order by kind, sort_order, code`,
  ).catch(() => []);
  return (rows as { code: string; kind: string; title: string; url: string; description: string }[]).map((r) => ({
    ...r,
    url: safeUrl(r.url),
  }));
}

/** Ghi 1 lượt và cho biết còn trong giới hạn không (đếm cả lượt vừa ghi). */
export async function withinPublicLimit(action: keyof typeof RATE_LIMITS, hash: string) {
  const lim = RATE_LIMITS[action];
  await dbQuery(`insert into m4.public_hits (action, ip_hash) values ($1, $2)`, [action, hash]);
  // Dọn lượt cũ (thỉnh thoảng) để bảng không phình.
  if (Math.random() < 0.02) await dbQuery(`delete from m4.public_hits where at < now() - interval '2 days'`);
  const [r] = await dbQuery(
    `select
       (select count(*)::int from m4.public_hits where action = $1 and ip_hash = $2 and at > now() - make_interval(mins => $3)) per_ip,
       (select count(*)::int from m4.public_hits where action = $1 and at > now() - interval '1 day') per_day`,
    [action, hash, lim.windowMinutes],
  );
  const perDayTotal = "perDayTotal" in lim ? lim.perDayTotal : Infinity;
  return Number(r.per_ip) <= lim.perIp && Number(r.per_day) <= perDayTotal;
}

/** Tạo yêu cầu từ cổng; mã ngẫu nhiên, thử lại nếu trùng. Trả về mã + đơn vị xử lý. */
export async function createPublicRequest(input: PublicRequestInput, hash: string) {
  const targetUnit = routeRequest(input.kind);
  const year = Number(todayISO().slice(0, 4));
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newRequestCode(year);
    const rows = await dbQuery(
      `insert into m4.service_requests
         (code, kind, target_unit, channel, org_name, contact_name, phone, email, address, description, sample_count, ip_hash)
       values ($1, $2, $3, 'Trực tuyến', $4, $5, $6, $7, $8, $9, $10, $11)
       on conflict (code) do nothing
       returning code`,
      [code, input.kind, targetUnit, input.orgName, input.contactName, input.phone, input.email, input.address, input.description, input.sampleCount, hash],
    );
    if (rows.length) return { code, targetUnit };
  }
  throw new Error("Không sinh được mã yêu cầu");
}

/** Tra cứu yêu cầu: cần đúng mã + số điện thoại; chỉ trả trạng thái, đơn vị, phản hồi công khai. */
export async function publicRequestStatus(code: string, phone: string) {
  if (!isDbConfigured()) return null;
  const [r] = await dbQuery(
    `select code, kind, target_unit, status, public_note, created_at, phone
     from m4.service_requests where code = $1`,
    [code.trim().toUpperCase()],
  );
  if (!r || normalizePhone(String(r.phone ?? "")) !== normalizePhone(phone)) return null;
  return {
    code: r.code as string,
    kind: r.kind as string,
    targetUnit: r.target_unit as string,
    status: r.status as string,
    publicNote: (r.public_note as string) ?? "",
    createdAt: String(r.created_at ?? ""),
  };
}
