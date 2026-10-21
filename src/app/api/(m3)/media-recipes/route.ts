import { mediaRecipeStore, type MediaRecipe } from "@/lib/modules/m3/data/tissue";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<MediaRecipe>(
  mediaRecipeStore,
  {
    code: "",
    name: "",
    stage: "Nhân nhanh",
    baseMedium: "MS",
    hormones: "",
    sugarGl: 30,
    agarGl: 7,
    ph: 5.8,
    status: "Đang dùng",
    note: "",
  },
  (b) => (!b.code ? "Thiếu mã công thức" : !b.name ? "Thiếu tên công thức" : null),
);
