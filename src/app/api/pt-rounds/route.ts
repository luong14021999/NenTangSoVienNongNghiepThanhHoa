import { ptRoundStore, verdictOfZ } from "@/lib/data/quality";
import { createRoute, listRoute } from "@/lib/api/crud";
import type { ExternalQCRound } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export const GET = listRoute(ptRoundStore);

export const POST = createRoute<ExternalQCRound>(
  ptRoundStore,
  (b) => {
    const z = Number(b.z ?? 0);
    return {
      id: "",
      type: b.type ?? "Thử nghiệm thành thạo",
      provider: b.provider ?? "",
      round: b.round ?? "",
      criterion: b.criterion ?? "",
      z,
      verdict: verdictOfZ(z),
      closedAt: b.closedAt ?? "",
    };
  },
  (b) => (!b.criterion ? "Thiếu chỉ tiêu" : !b.provider ? "Thiếu đơn vị tổ chức PT" : null),
);
