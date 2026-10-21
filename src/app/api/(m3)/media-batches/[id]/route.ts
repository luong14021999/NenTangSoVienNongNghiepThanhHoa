import { mediaBatchStore } from "@/lib/modules/m3/data/tissue";
import { itemRoutes } from "@/lib/platform/api/crud";
import { validateMediaBatch } from "@/lib/modules/m3/tissue-rules";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemRoutes(mediaBatchStore, { validate: validateMediaBatch });
