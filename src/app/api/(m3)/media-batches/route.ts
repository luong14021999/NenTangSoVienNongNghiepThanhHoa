import { mediaBatchStore, type MediaBatch } from "@/lib/modules/m3/data/tissue";
import { collectionRoutes } from "@/lib/platform/api/crud";
import { validateMediaBatch } from "@/lib/modules/m3/tissue-rules";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<MediaBatch>(
  mediaBatchStore,
  {
    code: "",
    recipeId: "",
    preparedAt: "",
    preparedBy: "",
    volumeL: 0,
    vessels: 0,
    phMeasured: 0,
    autoclaveTempC: 121,
    autoclaveMinutes: 20,
    autoclaveAt: "",
    qcResult: "Chờ kiểm tra",
    qcNote: "",
    expiresAt: "",
    note: "",
  },
  (b) => (!b.code ? "Thiếu mã lô" : !b.recipeId ? "Chọn công thức" : validateMediaBatch({ phMeasured: Number(b.phMeasured) || 0, autoclaveTempC: Number(b.autoclaveTempC) || 0, autoclaveMinutes: Number(b.autoclaveMinutes) || 0, qcResult: b.qcResult ?? "" })),
);
