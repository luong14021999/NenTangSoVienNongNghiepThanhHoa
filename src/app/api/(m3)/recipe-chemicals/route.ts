import { recipeChemicalStore, type RecipeChemical } from "@/lib/modules/m3/data/tissue";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<RecipeChemical>(
  recipeChemicalStore,
  {
    recipeId: "",
    chemical: "",
    chemicalCode: "",
    amountPerL: 0,
    unit: "mg",
    note: "",
  },
  (b) => (!b.recipeId ? "Thiếu công thức" : !b.chemical ? "Nhập tên hóa chất" : !(Number(b.amountPerL) > 0) ? "Định mức phải lớn hơn 0" : null),
);
