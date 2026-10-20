// Khởi tạo danh mục tài liệu (§8.3) từ dữ liệu có thật của PTN:
// - Tài liệu bên ngoài: TCVN ISO/IEC 17025:2017 + các phương pháp tiêu chuẩn trong phạm vi VILAS 1501
// - Tài liệu nội bộ: 3 SOP GC-MS (AEMD-HD) và các biểu mẫu AEMD-BM đang dùng trên phần mềm
// Chạy: npm run db:seed-documents  (bỏ qua mã đã có → không ghi đè, chạy lại an toàn)
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { accreditedTests } from "../src/lib/accreditation";
config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌ Thiếu DATABASE_URL trong .env.local");
  process.exit(1);
}

type Doc = {
  code: string;
  title: string;
  doc_type: string;
  version?: string;
  status: string;
  note?: string;
};

const docs: Doc[] = [
  {
    code: "TCVN ISO/IEC 17025:2017",
    title: "Yêu cầu chung về năng lực của phòng thử nghiệm và hiệu chuẩn",
    doc_type: "Tài liệu bên ngoài",
    version: "2017",
    status: "Hiệu lực",
    note: "Chuẩn mực công nhận VILAS 1501",
  },
  { code: "AEMD-BM-08.01", title: "Phiếu thu thập ý kiến khách hàng", doc_type: "Biểu mẫu", version: "Lần ban hành 1", status: "Hiệu lực" },
  { code: "AEMD-BM-10.02", title: "Phiếu theo dõi điều kiện môi trường", doc_type: "Biểu mẫu", version: "Lần ban hành 2", status: "Hiệu lực" },
  { code: "AEMD-BM-13.05", title: "Sổ theo dõi mẫu lưu", doc_type: "Biểu mẫu", status: "Hiệu lực" },
];

// Phương pháp trong phạm vi công nhận: mỗi mã phương pháp 1 tài liệu
const byMethod = new Map<string, string[]>();
for (const t of accreditedTests) {
  const code = t.method.replace(/\s*\(Ref:.*\)$/, "").trim();
  byMethod.set(code, [...(byMethod.get(code) ?? []), `${t.no}. ${t.name}`]);
}
for (const [code, tests] of byMethod) {
  const internal = code.startsWith("AEMD-");
  const first = tests[0].replace(/^\d+\.\s*/, "");
  docs.push({
    code,
    title: tests.length > 1 ? `${first} (+${tests.length - 1} phép thử khác)` : first,
    doc_type: internal ? "Hướng dẫn / SOP" : "Tài liệu bên ngoài",
    version: internal ? code.split(":").at(-1) : undefined,
    status: "Hiệu lực",
    note: [
      `Phương pháp trong phạm vi VILAS 1501 – phép thử số ${tests.map((t) => t.split(".")[0]).join(", ")}`,
      internal ? "Phương pháp do PTN xây dựng – cần hồ sơ xác nhận giá trị sử dụng (§7.2.2)" : "",
      code === "TCVN 9291:20158" ? "Năm ban hành in sai trong danh mục BoA – cần xác nhận" : "",
    ]
      .filter(Boolean)
      .join(". "),
  });
}

async function main() {
  const sql = neon(url!);
  const rows = await sql.query(
    `insert into public.qms_documents (code, title, doc_type, version, status, note)
     select code, title, doc_type, version, status, note
     from json_populate_recordset(null::public.qms_documents, $1::json) r
     where not exists (select 1 from public.qms_documents d where d.code = r.code)
     returning code`,
    [JSON.stringify(docs)],
  );
  console.log(`✓ qms_documents: thêm ${rows.length}/${docs.length} (bỏ qua mã đã có)`);
}

main().catch((e) => {
  console.error("❌", (e as Error).message);
  process.exit(1);
});
