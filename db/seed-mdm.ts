// Khởi tạo danh mục dùng chung (M1.2) từ dữ liệu đã có trong hệ thống. Chạy lại an toàn (không ghi đè mục đã có).
// Chạy: npx tsx db/seed-mdm.ts
import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { dbQuery } = await import("@/lib/db");
  const { accreditedTests, matrixEn } = await import("@/lib/accreditation");

  const catalogs = [
    { code: "PHEP_THU", name: "Phép thử được công nhận", description: "59 phép thử VILAS 1501 – dùng chung cho LIMS, báo giá, cổng dịch vụ", owner: "Phòng phân tích", source: "QĐ 1510/QĐ-VPCNCLQG ngày 09/06/2026" },
    { code: "NEN_MAU", name: "Nền mẫu thử nghiệm", description: "Nền mẫu theo phạm vi công nhận", owner: "Phòng phân tích", source: "Phạm vi công nhận VILAS 1501" },
    { code: "LOAI_KH", name: "Loại khách hàng", description: "Phân loại khách hàng dùng cho CRM, thống kê", owner: "Bộ phận tiếp nhận", source: "Dữ liệu khách hàng hiện có" },
    { code: "LOAI_MAU", name: "Loại mẫu tiếp nhận", description: "Loại mẫu ghi trên phiếu tiếp nhận", owner: "Bộ phận tiếp nhận", source: "Dữ liệu mẫu hiện có" },
    { code: "DON_VI_TINH", name: "Đơn vị tính", description: "Đơn vị tính kết quả và vật tư", owner: "QA/QC", source: "Nhập ban đầu" },
    { code: "DVHC", name: "Đơn vị hành chính", description: "Đơn vị hành chính – cần nhập / đồng bộ từ danh mục quốc gia", owner: "Quản trị hệ thống", source: "Danh mục hành chính quốc gia (cần cập nhật)" },
  ];
  for (const c of catalogs) {
    await dbQuery(
      `insert into public.mdm_catalogs (code, name, description, owner, source) values ($1, $2, $3, $4, $5) on conflict (code) do nothing`,
      [c.code, c.name, c.description, c.owner, c.source],
    );
  }
  const items: { catalog: string; code: string; name: string; nameEn?: string; parent?: string; attrs?: object }[] = [];
  const mCode = (m: string) => ({ "Đất": "DAT", "Nước mặt, nước ngầm": "NUOC_MAT_NGAM", "Nước mặt": "NUOC_MAT", "Phân bón": "PHAN_BON", "Rau, quả": "RAU_QUA" })[m] ?? m;
  for (const m of Object.keys(matrixEn)) items.push({ catalog: "NEN_MAU", code: mCode(m), name: m, nameEn: matrixEn[m as keyof typeof matrixEn] });
  for (const t of accreditedTests)
    items.push({ catalog: "PHEP_THU", code: `PT${String(t.no).padStart(2, "0")}`, name: t.name, nameEn: t.nameEn, parent: mCode(t.matrix), attrs: { so: t.no, phuongPhap: t.method, loq: t.loq, nenMau: t.matrix } });
  const kinds = await dbQuery(`select distinct kind from public.customers where kind is not null and kind <> '' order by 1`);
  kinds.forEach((k, i) => items.push({ catalog: "LOAI_KH", code: `KH${String(i + 1).padStart(2, "0")}`, name: k.kind as string }));
  const types = await dbQuery(`select distinct type from public.samples where type is not null and type <> '' order by 1`);
  types.forEach((k, i) => items.push({ catalog: "LOAI_MAU", code: `LM${String(i + 1).padStart(2, "0")}`, name: k.type as string }));
  for (const [code, name] of [["PCT", "%"], ["MG_KG", "mg/kg"], ["MG_L", "mg/L"], ["UG_KG", "µg/kg"], ["MEQ_100G", "meq/100g"], ["PH", "pH"], ["MS_CM", "mS/cm"], ["CFU_G", "CFU/g"], ["CHAI", "chai"], ["HOP", "hộp"], ["G", "g"], ["ML", "mL"]])
    items.push({ catalog: "DON_VI_TINH", code, name });
  items.push({ catalog: "DVHC", code: "38", name: "Tỉnh Thanh Hóa", attrs: { cap: "Tỉnh", ghiChu: "Mã theo danh mục hành chính quốc gia – kiểm tra lại khi đồng bộ" } });

  let added = 0;
  for (const i of items) {
    const r = await dbQuery(
      `insert into public.mdm_items (catalog_code, code, name, name_en, parent_code, attrs, updated_by) values ($1, $2, $3, $4, $5, $6::jsonb, 'Khởi tạo')
       on conflict (catalog_code, code) do nothing returning id`,
      [i.catalog, i.code, i.name, i.nameEn ?? "", i.parent ?? null, JSON.stringify(i.attrs ?? {})],
    );
    added += r.length;
  }
  console.log(`✅ ${catalogs.length} danh mục, thêm ${added}/${items.length} mục`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
