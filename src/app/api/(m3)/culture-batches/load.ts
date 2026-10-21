import { NextResponse } from "next/server";
import { cultureBatchStore, type CultureBatch } from "@/lib/modules/m3/data/tissue";
import { authorize } from "@/lib/platform/data/access";
import { permissionForEntity } from "@/lib/platform/permissions";

const isUniqueViolation = (e: unknown) => /duplicate key value|unique constraint/i.test((e as Error)?.message ?? "");

/** Quyền ghi mẻ cấy + đọc mẻ theo id + thân yêu cầu – dùng chung cho các thao tác trên bàn cấy. */
export async function loadBatchAction<B>(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize(permissionForEntity("culture-batches"));
  if (!gate.ok) return { response: gate.response } as const;
  const { id } = await ctx.params;
  const batches = await cultureBatchStore.list();
  const batch = batches.find((b) => b.id === id);
  if (!batch) return { response: NextResponse.json({ error: "Không tìm thấy mẻ cấy" }, { status: 404 }) } as const;
  const body = (await req.json().catch(() => ({}))) as B;
  return { batch, batches, body } as const satisfies { batch: CultureBatch; batches: CultureBatch[]; body: B };
}

export const badRequest = (error: string) => NextResponse.json({ error }, { status: 400 });

/** Lỗi khi tạo bản ghi mới: trùng mã → 409, còn lại ném tiếp. */
export function createError(e: unknown, what: string) {
  if (isUniqueViolation(e)) return NextResponse.json({ error: `Mã ${what} đã tồn tại – chọn mã khác` }, { status: 409 });
  throw e;
}
