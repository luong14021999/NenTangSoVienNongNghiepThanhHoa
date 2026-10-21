import { NextResponse } from "next/server";
import { openApiSpec } from "@/lib/platform/integration/openapi";

export const dynamic = "force-dynamic";

/** Đặc tả OpenAPI (công khai, không cần khóa). */
export function GET(req: Request) {
  return NextResponse.json(openApiSpec(new URL(req.url).origin));
}
