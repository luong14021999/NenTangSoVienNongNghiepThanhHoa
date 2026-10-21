import { describe, expect, it } from "vitest";
import { contractBalances, quotationTotal } from "./m4/finance";
import { contaminationRate, pct, survivalRate } from "./m3/rates";
import { columnsMapping, qualifiedTable } from "@/lib/platform/data/factory";
import { permissionForEntity, roleAllows } from "@/lib/platform/permissions";

describe("M4 tài chính", () => {
  it("tổng báo giá sau thuế, làm tròn đồng", () => {
    expect(quotationTotal(1_000_000, 8)).toBe(1_080_000);
    expect(quotationTotal(333_333, 10)).toBe(366_666);
    expect(quotationTotal(500_000, 0)).toBe(500_000);
  });

  it("công nợ = giá trị − tổng thanh toán, không âm", () => {
    const b = contractBalances(
      [{ id: "a", value: 10_000_000 }, { id: "b", value: 2_000_000 }, { id: "c", value: 5_000_000 }],
      [
        { contractId: "a", amount: 3_000_000 },
        { contractId: "a", amount: 2_000_000 },
        { contractId: "b", amount: 2_500_000 },
        { contractId: "", amount: 9_000_000 },
      ],
    );
    expect(b.get("a")).toEqual({ paid: 5_000_000, debt: 5_000_000 });
    expect(b.get("b")).toEqual({ paid: 2_500_000, debt: 0 });
    expect(b.get("c")).toEqual({ paid: 0, debt: 5_000_000 });
  });
});

describe("M3 tỷ lệ", () => {
  it("tỷ lệ nhiễm và tỷ lệ sống, 1 chữ số thập phân", () => {
    expect(contaminationRate({ contaminated: 3, vessels: 40 })).toBe(7.5);
    expect(survivalRate({ survived: 2, quantity: 3 })).toBe(66.7);
  });

  it("mẫu số 0 → chưa có dữ liệu", () => {
    expect(pct(0, 0)).toBeNull();
    expect(contaminationRate({ contaminated: 0, vessels: 0 })).toBeNull();
  });
});

describe("schema phân hệ", () => {
  it("tên bảng có schema được trích dẫn đúng", () => {
    expect(qualifiedTable("customers")).toBe('public."customers"');
    expect(qualifiedTable("m3_tissue.culture_batches")).toBe('"m3_tissue"."culture_batches"');
  });

  it("khóa ngoại chưa chọn ghi null, không ghi chuỗi rỗng", () => {
    const m = columnsMapping<{ id: string; code: string; customerId: string }>("m4.quotations", { code: "text", customerId: "ref" });
    expect(m.toRow({ code: "BG-1", customerId: "" })).toEqual({ code: "BG-1", customer_id: null });
    expect(m.toRow({ customerId: "abc" })).toEqual({ customer_id: "abc" });
  });

  it("quyền ghi theo phân hệ", () => {
    expect(permissionForEntity("contracts")).toBe("write.services");
    expect(permissionForEntity("culture-batches")).toBe("write.tissue");
    expect(permissionForEntity("varieties")).toBe("write.breeding");
    expect(roleAllows(["Dịch vụ – Kế toán"], "write.services")).toBe(true);
    expect(roleAllows(["KTV"], "write.services")).toBe(false);
    expect(roleAllows(["Nuôi cấy mô"], "write.breeding")).toBe(false);
  });
});
