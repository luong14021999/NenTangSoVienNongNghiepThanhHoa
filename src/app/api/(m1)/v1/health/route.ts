import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Kiểm tra sống (không cần khóa, không lộ thông tin nội bộ). */
export function GET() {
  return NextResponse.json({ status: "ok", time: new Date().toISOString() });
}
