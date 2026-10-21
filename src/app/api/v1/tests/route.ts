import { NextResponse } from "next/server";
import { withApiKey } from "@/lib/data/integration";
import { accreditedTests, labInfo } from "@/lib/accreditation";

export const dynamic = "force-dynamic";

export const GET = withApiKey("tests:read", async () =>
  NextResponse.json({
    accreditation: { code: labInfo.vilasCode, standard: labInfo.standard, decision: labInfo.decisionNo, validTo: labInfo.validTo },
    count: accreditedTests.length,
    items: accreditedTests.map((t) => ({ no: t.no, matrix: t.matrix, name: t.name, nameEn: t.nameEn, method: t.method, loq: t.loq })),
  }),
);
