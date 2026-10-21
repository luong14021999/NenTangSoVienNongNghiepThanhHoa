// M3.1 – nuôi cấy mô & truy xuất nguồn gốc (schema m3_tissue).
import { columnsMapping, createEntityStore } from "@/lib/platform/data/factory";

// ── Vật liệu khởi đầu ──────────────────────────────────────────────
export const EXPLANT_TYPES = ["Đỉnh sinh trưởng", "Mắt ngủ", "Lá", "Hạt", "Khác"] as const;
export const MATERIAL_STATUSES = ["Đang khử trùng", "Sạch – đưa vào nuôi cấy", "Nhiễm – loại bỏ"] as const;

export type TissueMaterial = {
  id: string;
  code: string;
  species: string;
  variety: string;
  source: string;
  collectedAt: string;
  explantType: string;
  quantity: number;
  sterilization: string;
  status: (typeof MATERIAL_STATUSES)[number];
  note: string;
};

export const tissueMaterialStore = createEntityStore<TissueMaterial>(
  "tissue-materials",
  [],
  columnsMapping<TissueMaterial>("m3_tissue.materials", {
    code: "text",
    species: "text",
    variety: "text",
    source: "text",
    collectedAt: "date",
    explantType: "text",
    quantity: "number",
    sterilization: "text",
    status: "text",
    note: "text",
  }),
);

// ── Công thức môi trường ───────────────────────────────────────────
export const CULTURE_STAGES = ["Khởi đầu", "Nhân nhanh", "Ra rễ", "Ra ngôi"] as const;
export const BASE_MEDIA = ["MS", "½MS", "WPM", "B5", "Khác"] as const;
export const RECIPE_STATUSES = ["Đang dùng", "Thử nghiệm", "Ngừng dùng"] as const;

export type MediaRecipe = {
  id: string;
  code: string;
  name: string;
  stage: string;
  baseMedium: string;
  hormones: string;
  sugarGl: number;
  agarGl: number;
  ph: number;
  status: (typeof RECIPE_STATUSES)[number];
  note: string;
};

export const mediaRecipeStore = createEntityStore<MediaRecipe>(
  "media-recipes",
  [],
  columnsMapping<MediaRecipe>("m3_tissue.media_recipes", {
    code: "text",
    name: "text",
    stage: "text",
    baseMedium: "text",
    hormones: "text",
    sugarGl: "number",
    agarGl: "number",
    ph: "number",
    status: "text",
    note: "text",
  }),
);

// ── Mẻ cấy ──────────────────────────────────────────────────────────
export const BATCH_STATUSES = ["Đang nuôi", "Đã cấy chuyển", "Chuyển ra ngôi", "Hủy"] as const;

export type CultureBatch = {
  id: string;
  code: string;
  materialId: string;
  recipeId: string;
  stage: string;
  subcultureNo: number;
  startedAt: string;
  nextTransferAt: string;
  vessels: number;
  contaminated: number;
  plantlets: number;
  room: string;
  operator: string;
  status: (typeof BATCH_STATUSES)[number];
  note: string;
};

export const cultureBatchStore = createEntityStore<CultureBatch>(
  "culture-batches",
  [],
  columnsMapping<CultureBatch>("m3_tissue.culture_batches", {
    code: "text",
    materialId: "ref",
    recipeId: "ref",
    stage: "text",
    subcultureNo: "number",
    startedAt: "date",
    nextTransferAt: "date",
    vessels: "number",
    contaminated: "number",
    plantlets: "number",
    room: "text",
    operator: "text",
    status: "text",
    note: "text",
  }),
);

// ── Lô cây giống (truy xuất nguồn gốc) ─────────────────────────────
export const LOT_GRADES = ["Loại 1", "Loại 2", "Không đạt"] as const;
export const LOT_STATUSES = ["Vườn ươm", "Đủ tiêu chuẩn xuất", "Đã xuất", "Hủy"] as const;

export type SeedlingLot = {
  id: string;
  code: string;
  batchId: string;
  acclimatizedAt: string;
  quantity: number;
  survived: number;
  grade: string;
  customerId: string;
  releasedAt: string;
  releasedQty: number;
  status: (typeof LOT_STATUSES)[number];
  note: string;
};

export const seedlingLotStore = createEntityStore<SeedlingLot>(
  "seedling-lots",
  [],
  columnsMapping<SeedlingLot>("m3_tissue.seedling_lots", {
    code: "text",
    batchId: "ref",
    acclimatizedAt: "date",
    quantity: "number",
    survived: "number",
    grade: "text",
    customerId: "ref",
    releasedAt: "date",
    releasedQty: "number",
    status: "text",
    note: "text",
  }),
);
