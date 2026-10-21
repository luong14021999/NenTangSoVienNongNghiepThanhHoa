import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { runHealthCheck } from "@/lib/platform/data/system";

export const dynamic = "force-dynamic";

export async function POST() {
  const gate = await authorize("admin.system");
  if (!gate.ok) return gate.response;
  return NextResponse.json(await runHealthCheck("Thủ công"));
}
