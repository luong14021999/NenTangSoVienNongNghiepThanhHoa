// M3.2 – giống cây trồng, vật nuôi, thủy sản (schema m3_breed).
import { columnsMapping, createEntityStore } from "@/lib/platform/data/factory";

export const BREED_KINDS = ["Cây trồng", "Vật nuôi", "Thủy sản"] as const;

// ── Lý lịch giống ───────────────────────────────────────────────────
export const VARIETY_STATUSES = ["Đang khảo nghiệm", "Được công nhận", "Lưu hành", "Ngừng sản xuất"] as const;

export type Variety = {
  id: string;
  code: string;
  name: string;
  kind: (typeof BREED_KINDS)[number];
  species: string;
  origin: string;
  owner: string;
  recognitionNo: string;
  recognizedAt: string;
  traits: string;
  status: (typeof VARIETY_STATUSES)[number];
  note: string;
};

export const varietyStore = createEntityStore<Variety>(
  "varieties",
  [],
  columnsMapping<Variety>("m3_breed.varieties", {
    code: "text",
    name: "text",
    kind: "text",
    species: "text",
    origin: "text",
    owner: "text",
    recognitionNo: "text",
    recognizedAt: "date",
    traits: "text",
    status: "text",
    note: "text",
  }),
);

// ── Nguồn gen ───────────────────────────────────────────────────────
export const CONSERVATION_METHODS = ["Đồng ruộng", "Kho lạnh", "In vitro", "Đông lạnh", "Trang trại"] as const;
export const GERMPLASM_STATUSES = ["Đang lưu giữ", "Cần phục tráng", "Đã mất"] as const;

export type Germplasm = {
  id: string;
  code: string;
  kind: (typeof BREED_KINDS)[number];
  species: string;
  localName: string;
  collectedAt: string;
  collectionSite: string;
  conservation: string;
  quantity: string;
  evaluation: string;
  status: (typeof GERMPLASM_STATUSES)[number];
  note: string;
};

export const germplasmStore = createEntityStore<Germplasm>(
  "germplasm",
  [],
  columnsMapping<Germplasm>("m3_breed.germplasm", {
    code: "text",
    kind: "text",
    species: "text",
    localName: "text",
    collectedAt: "date",
    collectionSite: "text",
    conservation: "text",
    quantity: "text",
    evaluation: "text",
    status: "text",
    note: "text",
  }),
);

// ── Khảo nghiệm ────────────────────────────────────────────────────
export const TRIAL_KINDS = ["Khảo nghiệm VCU", "Khảo nghiệm DUS", "Sản xuất thử", "So sánh giống"] as const;
export const TRIAL_RESULTS = ["Đang theo dõi", "Đạt", "Không đạt"] as const;

export type BreedTrial = {
  id: string;
  code: string;
  varietyId: string;
  kind: (typeof TRIAL_KINDS)[number];
  site: string;
  season: string;
  startAt: string;
  endAt: string;
  yield: string;
  result: (typeof TRIAL_RESULTS)[number];
  leader: string;
  note: string;
};

export const breedTrialStore = createEntityStore<BreedTrial>(
  "breed-trials",
  [],
  columnsMapping<BreedTrial>("m3_breed.trials", {
    code: "text",
    varietyId: "ref",
    kind: "text",
    site: "text",
    season: "text",
    startAt: "date",
    endAt: "date",
    yield: "text",
    result: "text",
    leader: "text",
    note: "text",
  }),
);
