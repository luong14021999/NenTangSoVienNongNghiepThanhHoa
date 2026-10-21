import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Ô "Xác minh phiếu kết quả" trên cổng → trang xác minh hiện có của M2. */
export default async function PortalVerifyRedirect({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const code = ((await searchParams).code ?? "").trim().slice(0, 64);
  redirect(code ? `/verify/${encodeURIComponent(code)}` : "/portal");
}
