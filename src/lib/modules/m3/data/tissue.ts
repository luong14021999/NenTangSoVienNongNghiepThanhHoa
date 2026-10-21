// M3.1 – nuôi cấy mô & truy xuất nguồn gốc (schema m3_tissue).
import { columnsMapping, createEntityStore } from "@/lib/platform/data/factory";
import { dbQuery, isDbConfigured } from "@/lib/platform/db";

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
  motherPlantId: string;
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
    motherPlantId: "ref",
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
  parentBatchId: string;
  mediaBatchId: string;
  cabinetId: string;
  roomId: string;
  explants: number;
  survived: number;
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
    parentBatchId: "ref",
    mediaBatchId: "ref",
    cabinetId: "ref",
    roomId: "ref",
    explants: "number",
    survived: "number",
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

// ── M3.1.1 Cây mẹ / hồ sơ nguồn giống ──────────────────────────────
export type MotherPlant = {
  id: string;
  code: string;
  species: string;
  variety: string;
  germplasmId: string;
  origin: string;
  location: string;
  plantedAt: string;
  selectionCriteria: string;
  diseaseStatus: string;
  diseaseTestedAt: string;
  diseaseMethod: string;
  pathogens: string;
  diseaseRef: string;
  status: string;
  note: string;
};

export const motherPlantStore = createEntityStore<MotherPlant>(
  "mother-plants",
  [],
  columnsMapping<MotherPlant>("m3_tissue.mother_plants", {
    code: "text",
    species: "text",
    variety: "text",
    germplasmId: "ref",
    origin: "text",
    location: "text",
    plantedAt: "date",
    selectionCriteria: "text",
    diseaseStatus: "text",
    diseaseTestedAt: "date",
    diseaseMethod: "text",
    pathogens: "text",
    diseaseRef: "text",
    status: "text",
    note: "text",
  }),
);

// ── M3.1.2 Định mức hóa chất, lô môi trường ────────────────────────
export type RecipeChemical = { id: string; recipeId: string; chemical: string; chemicalCode: string; amountPerL: number; unit: string; note: string };

export const recipeChemicalStore = createEntityStore<RecipeChemical>(
  "recipe-chemicals",
  [],
  columnsMapping<RecipeChemical>("m3_tissue.recipe_chemicals", {
    recipeId: "ref",
    chemical: "text",
    chemicalCode: "text",
    amountPerL: "number",
    unit: "text",
    note: "text",
  }),
);

export type MediaBatch = {
  id: string;
  code: string;
  recipeId: string;
  preparedAt: string;
  preparedBy: string;
  volumeL: number;
  vessels: number;
  phMeasured: number;
  autoclaveTempC: number;
  autoclaveMinutes: number;
  autoclaveAt: string;
  qcResult: string;
  qcNote: string;
  expiresAt: string;
  note: string;
};

export const mediaBatchStore = createEntityStore<MediaBatch>(
  "media-batches",
  [],
  columnsMapping<MediaBatch>("m3_tissue.media_batches", {
    code: "text",
    recipeId: "ref",
    preparedAt: "date",
    preparedBy: "text",
    volumeL: "number",
    vessels: "number",
    phMeasured: "number",
    autoclaveTempC: "number",
    autoclaveMinutes: "number",
    autoclaveAt: "date",
    qcResult: "text",
    qcNote: "text",
    expiresAt: "date",
    note: "text",
  }),
);

// ── M3.1.4 Tủ cấy, phòng nuôi, số liệu thiết bị đo ─────────────────
export type Cabinet = { id: string; code: string; name: string; room: string; lastMaintainedAt: string; lastFilterCheckAt: string; status: string; note: string };

export const cabinetStore = createEntityStore<Cabinet>(
  "cabinets",
  [],
  columnsMapping<Cabinet>("m3_tissue.cabinets", {
    code: "text",
    name: "text",
    room: "text",
    lastMaintainedAt: "date",
    lastFilterCheckAt: "date",
    status: "text",
    note: "text",
  }),
);

export type GrowthRoom = {
  id: string;
  code: string;
  name: string;
  deviceCode: string;
  tempMin: number;
  tempMax: number;
  humidityMin: number;
  humidityMax: number;
  lightMin: number;
  lightMax: number;
  photoperiod: string;
  note: string;
};

export const growthRoomStore = createEntityStore<GrowthRoom>(
  "growth-rooms",
  [],
  columnsMapping<GrowthRoom>("m3_tissue.growth_rooms", {
    code: "text",
    name: "text",
    deviceCode: "text",
    tempMin: "number",
    tempMax: "number",
    humidityMin: "number",
    humidityMax: "number",
    lightMin: "number",
    lightMax: "number",
    photoperiod: "text",
    note: "text",
  }),
);

export type RoomReading = { id: string; roomId: string; at: string; temperature: number | null; humidity: number | null; light: number | null; source: string; deviceCode: string };

const toReading = (r: Record<string, unknown>): RoomReading => ({
  id: String(r.id),
  roomId: r.room_id as string,
  at: r.at as string,
  temperature: r.temperature as number | null,
  humidity: r.humidity as number | null,
  light: r.light as number | null,
  source: (r.source as string) ?? "",
  deviceCode: (r.device_code as string) ?? "",
});

/** Số liệu đo trong `hours` giờ gần nhất (mới nhất trước). */
export async function readingsOf(roomId: string, hours = 72, limit = 2000) {
  if (!isDbConfigured()) return [];
  const rows = await dbQuery(
    `select id, room_id, at, temperature, humidity, light, source, device_code from m3_tissue.room_readings
     where room_id = $1 and at > now() - make_interval(hours => $2) order by at desc limit $3`,
    [roomId, hours, limit],
  ).catch(() => []);
  return rows.map(toReading);
}

/** Lần đo mới nhất của mỗi phòng. */
export async function latestReadings() {
  if (!isDbConfigured()) return new Map<string, RoomReading>();
  const rows = await dbQuery(
    `select distinct on (room_id) id, room_id, at, temperature, humidity, light, source, device_code
     from m3_tissue.room_readings order by room_id, at desc`,
  ).catch(() => []);
  return new Map(rows.map((r) => [r.room_id as string, toReading(r)]));
}

export async function insertReading(
  roomId: string,
  r: { temperature: number | null; humidity: number | null; light: number | null; at: string | null },
  source: "Thiết bị" | "Nhập tay",
  deviceCode = "",
) {
  const [row] = await dbQuery(
    `insert into m3_tissue.room_readings (room_id, at, temperature, humidity, light, source, device_code)
     values ($1, coalesce($2::timestamptz, now()), $3, $4, $5, $6, $7) returning id`,
    [roomId, r.at, r.temperature, r.humidity, r.light, source, deviceCode],
  );
  return String(row.id);
}
