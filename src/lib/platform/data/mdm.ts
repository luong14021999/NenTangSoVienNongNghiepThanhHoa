// M1.2 Danh mục dùng chung (Master Data): một bản gốc cho mỗi danh mục, các phân hệ tham chiếu theo mã.
// Mỗi lần sửa tăng phiên bản; không xoá cứng mục đang dùng – chuyển "Ngừng sử dụng".
import { dbQuery } from "@/lib/platform/db";

export const MDM_STATUSES = ["Hiệu lực", "Ngừng sử dụng"] as const;

export type MdmCatalog = { code: string; name: string; description: string; owner: string; source: string; updatedAt: string; items: number; active: number };
export type MdmItem = {
  id: string;
  catalogCode: string;
  code: string;
  name: string;
  nameEn: string;
  parentCode: string;
  attrs: Record<string, unknown>;
  status: (typeof MDM_STATUSES)[number];
  version: number;
  validFrom: string;
  updatedBy: string;
  updatedAt: string;
};

const toItem = (r: Record<string, unknown>): MdmItem => ({
  id: r.id as string,
  catalogCode: r.catalog_code as string,
  code: r.code as string,
  name: r.name as string,
  nameEn: (r.name_en as string) ?? "",
  parentCode: (r.parent_code as string) ?? "",
  attrs: (r.attrs as Record<string, unknown>) ?? {},
  status: ((r.status as string) || "Hiệu lực") as MdmItem["status"],
  version: Number(r.version ?? 1),
  validFrom: (r.valid_from as string) ?? "",
  updatedBy: (r.updated_by as string) ?? "",
  updatedAt: (r.updated_at as string) ?? "",
});

export async function listCatalogs(): Promise<MdmCatalog[]> {
  const rows = await dbQuery(
    `select c.*, count(i.id)::int items, count(i.id) filter (where i.status = 'Hiệu lực')::int active
     from public.mdm_catalogs c left join public.mdm_items i on i.catalog_code = c.code
     group by c.code order by c.name`,
  );
  return rows.map((r) => ({
    code: r.code as string,
    name: r.name as string,
    description: (r.description as string) ?? "",
    owner: (r.owner as string) ?? "",
    source: (r.source as string) ?? "",
    updatedAt: (r.updated_at as string) ?? "",
    items: Number(r.items),
    active: Number(r.active),
  }));
}

export async function listItems(catalog: string, opts: { activeOnly?: boolean } = {}): Promise<MdmItem[]> {
  const rows = await dbQuery(
    `select * from public.mdm_items where catalog_code = $1 ${opts.activeOnly ? "and status = 'Hiệu lực'" : ""} order by code`,
    [catalog],
  );
  return rows.map(toItem);
}

export async function getItem(id: string) {
  const [r] = await dbQuery(`select * from public.mdm_items where id = $1`, [id]);
  return r ? toItem(r) : null;
}

/** Kiểm tra dữ liệu mục danh mục (thuần). */
export function validateItem(i: { code?: string; name?: string; parentCode?: string }, siblings: { code: string; id?: string }[], selfId?: string) {
  const code = (i.code ?? "").trim();
  if (!code) return "Thiếu mã";
  if (!/^[A-Za-z0-9._-]{1,40}$/.test(code)) return "Mã chỉ gồm chữ không dấu, số, . _ - (tối đa 40 ký tự)";
  if (!(i.name ?? "").trim()) return "Thiếu tên";
  if (siblings.some((s) => s.code.toLowerCase() === code.toLowerCase() && s.id !== selfId)) return `Mã ${code} đã có trong danh mục`;
  if (i.parentCode && i.parentCode === code) return "Mục cha không được trùng chính nó";
  return null;
}

export async function createItem(catalog: string, i: Partial<MdmItem>, actor: string) {
  const [r] = await dbQuery(
    `insert into public.mdm_items (catalog_code, code, name, name_en, parent_code, attrs, status, valid_from, updated_by)
     values ($1, $2, $3, $4, $5, $6::jsonb, $7, coalesce($8::date, current_date), $9) returning *`,
    [catalog, i.code!.trim(), i.name!.trim(), i.nameEn ?? "", i.parentCode || null, JSON.stringify(i.attrs ?? {}), i.status ?? "Hiệu lực", i.validFrom || null, actor],
  );
  await dbQuery(`update public.mdm_catalogs set updated_at = now() where code = $1`, [catalog]);
  return toItem(r);
}

/** Sửa → phiên bản + 1. */
export async function updateItem(id: string, i: Partial<MdmItem>, actor: string) {
  const [r] = await dbQuery(
    `update public.mdm_items set
       code = coalesce($2, code), name = coalesce($3, name), name_en = coalesce($4, name_en),
       parent_code = case when $5::text is null then parent_code else nullif($5, '') end,
       attrs = coalesce($6::jsonb, attrs), status = coalesce($7, status),
       valid_from = coalesce(nullif($8, '')::date, valid_from),
       version = version + 1, updated_by = $9, updated_at = now()
     where id = $1 returning *`,
    [id, i.code?.trim() ?? null, i.name?.trim() ?? null, i.nameEn ?? null, i.parentCode ?? null, i.attrs ? JSON.stringify(i.attrs) : null, i.status ?? null, i.validFrom ?? null, actor],
  );
  if (r) await dbQuery(`update public.mdm_catalogs set updated_at = now() where code = $1`, [r.catalog_code]);
  return r ? toItem(r) : null;
}

export async function deleteItem(id: string) {
  const [r] = await dbQuery(`delete from public.mdm_items where id = $1 returning *`, [id]);
  return r ? toItem(r) : null;
}
