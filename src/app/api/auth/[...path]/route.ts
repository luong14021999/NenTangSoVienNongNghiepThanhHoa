import { NextResponse } from "next/server";
import { auth } from "@/lib/platform/auth/server";

const notConfigured = async () =>
  NextResponse.json({ error: "Neon Auth chưa được cấu hình" }, { status: 503 });

export const { GET, POST, PUT, DELETE, PATCH } = auth
  ? auth.handler()
  : {
      GET: notConfigured,
      POST: notConfigured,
      PUT: notConfigured,
      DELETE: notConfigured,
      PATCH: notConfigured,
    };
