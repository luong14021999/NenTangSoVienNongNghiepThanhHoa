// Dữ liệu gửi lên LGSP / NDXP theo từng dịch vụ (M1.3). Chỉ dữ liệu được phép chia sẻ – không có dữ liệu cá nhân.
import { accreditedTests, labInfo } from "@/lib/modules/m2/accreditation";
import { dbQuery } from "@/lib/platform/db";
import { getReportByCode } from "@/lib/modules/m2/data/reports";
import type { OutboundService } from "@/lib/platform/integration/lgsp";

export async function buildOutboundData(service: OutboundService, ref: string) {
  if (service === "danh-muc-phep-thu") {
    return {
      donVi: labInfo.organization,
      maCongNhan: labInfo.vilasCode,
      quyetDinh: labInfo.decisionNo,
      hieuLucDen: labInfo.validTo,
      phepThu: accreditedTests.map((t) => ({ so: t.no, nenMau: t.matrix, ten: t.name, phuongPhap: t.method, gioiHanDinhLuong: t.loq })),
    };
  }
  if (service === "danh-muc-dung-chung") {
    const catalog = ref || "PHEP_THU";
    const items = await dbQuery(`select code, name, name_en, parent_code, status, version from public.mdm_items where catalog_code = $1 order by code`, [catalog]);
    if (!items.length) throw new Error(`Danh mục ${catalog} trống hoặc không tồn tại`);
    return { danhMuc: catalog, soMuc: items.length, muc: items };
  }
  if (service === "nhiem-vu-khcn") {
    if (!ref) throw new Error("Nhập mã nhiệm vụ");
    const [t] = await dbQuery(
      `select t.code, t.title, t.kind, t.level, t.field, t.host_unit, t.objectives, t.keywords, t.start_at, t.end_at,
              t.budget_state, t.budget_other, t.status, t.approval_no, t.approved_at, t.acceptance_result, t.accepted_at, t.outputs,
              r.full_name leader, r.degree leader_degree
       from m4.research_tasks t left join m4.researchers r on r.id = t.leader_id where t.code = $1`,
      [ref],
    );
    if (!t) throw new Error(`Không có nhiệm vụ ${ref}`);
    // Chỉ thông tin công bố của nhiệm vụ (tên, cấp, chủ nhiệm, kinh phí, kết quả) – không có liên hệ cá nhân.
    return {
      donViChuTri: t.host_unit || labInfo.organization,
      maNhiemVu: t.code,
      tenNhiemVu: t.title,
      loai: t.kind,
      cap: t.level,
      linhVuc: t.field,
      chuNhiem: t.leader ? `${t.leader_degree ? t.leader_degree + " " : ""}${t.leader}` : null,
      mucTieu: t.objectives,
      tuKhoa: t.keywords,
      thoiGian: { batDau: t.start_at, ketThuc: t.end_at },
      kinhPhi: { nganSachNhaNuoc: t.budget_state, nguonKhac: t.budget_other },
      trangThai: t.status,
      quyetDinhPheDuyet: t.approval_no ? { so: t.approval_no, ngay: t.approved_at } : null,
      nghiemThu: t.acceptance_result ? { ketQua: t.acceptance_result, ngay: t.accepted_at } : null,
      sanPham: t.outputs,
    };
  }
  if (service === "ket-qua-kiem-nghiem") {
    if (!ref) throw new Error("Nhập mã phiếu kết quả");
    const r = await getReportByCode(ref);
    if (!r) throw new Error(`Không có phiếu ${ref}`);
    return { maPhieu: r.code, maMau: r.sampleCode, lanBanHanh: r.revision, trangThai: r.status, ngayPhatHanh: r.issuedAt, maBam: r.contentHash };
  }
  const month = /^\d{4}-\d{2}$/.test(ref) ? ref : new Date().toISOString().slice(0, 7);
  const [s] = await dbQuery(
    `select
       (select count(*)::int from analytics.fact_samples where to_char(received_at, 'YYYY-MM') = $1) mau_tiep_nhan,
       (select count(*)::int from analytics.fact_samples where to_char(first_issued_at at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM') = $1) phieu_phat_hanh,
       (select percentile_cont(0.5) within group (order by tat_days) from analytics.fact_samples where to_char(first_issued_at at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM') = $1) tat_trung_vi,
       (select coalesce(sum(total), 0) from analytics.fact_revenue where month = $1 and status in ('KH chấp nhận', 'Đã ký HĐ', 'Đã nhận mẫu')) doanh_thu`,
    [month],
  );
  return { donVi: labInfo.organization, kyBaoCao: month, ...s };
}
