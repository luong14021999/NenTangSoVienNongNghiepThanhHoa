// M4.3 Truy xuất nguồn gốc lô cây giống – chỉ các trường được phép công bố (không có khách hàng, người cấy, ghi chú nội bộ).
import { dbQuery, isDbConfigured } from "@/lib/platform/db";

export type PublicLotTrace = {
  lotCode: string;
  status: string;
  grade: string;
  acclimatizedAt: string;
  releasedAt: string;
  quantity: number;
  survived: number;
  species: string;
  variety: string;
  explantType: string;
  collectedAt: string;
  materialCode: string;
  batchCode: string;
  stage: string;
  subcultureNo: number;
  batchStartedAt: string;
  recipeCode: string;
  recipeName: string;
  baseMedium: string;
};

export async function publicLotTrace(code: string): Promise<PublicLotTrace | null> {
  if (!isDbConfigured() || !code || code.length > 64) return null;
  const [r] = await dbQuery(
    `select l.code lot_code, l.status, l.grade, l.acclimatized_at, l.released_at, l.quantity, l.survived,
            m.species, m.variety, m.explant_type, m.collected_at, m.code material_code,
            b.code batch_code, b.stage, b.subculture_no, b.started_at batch_started_at,
            r.code recipe_code, r.name recipe_name, r.base_medium
     from m3_tissue.seedling_lots l
     left join m3_tissue.culture_batches b on b.id = l.batch_id
     left join m3_tissue.materials m on m.id = b.material_id
     left join m3_tissue.media_recipes r on r.id = b.recipe_id
     where l.code = $1 and l.status <> 'Hủy'`,
    [code.trim()],
  ).catch(() => []);
  if (!r) return null;
  const s = (k: string) => (r[k] == null ? "" : String(r[k]));
  const n = (k: string) => Number(r[k] ?? 0) || 0;
  return {
    lotCode: s("lot_code"),
    status: s("status"),
    grade: s("grade"),
    acclimatizedAt: s("acclimatized_at"),
    releasedAt: s("released_at"),
    quantity: n("quantity"),
    survived: n("survived"),
    species: s("species"),
    variety: s("variety"),
    explantType: s("explant_type"),
    collectedAt: s("collected_at"),
    materialCode: s("material_code"),
    batchCode: s("batch_code"),
    stage: s("stage"),
    subcultureNo: n("subculture_no"),
    batchStartedAt: s("batch_started_at"),
    recipeCode: s("recipe_code"),
    recipeName: s("recipe_name"),
    baseMedium: s("base_medium"),
  };
}
