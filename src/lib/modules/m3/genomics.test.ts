import { describe, expect, it } from "vitest";
import {
  alleleSharing,
  compareProfiles,
  genotypeOf,
  identifySample,
  parseGenotypeCsv,
  profilesBySample,
  purityTest,
  referenceProfiles,
  validateCoordinates,
  type Profile,
} from "./genomics";
// Hàm thuần của dịch vụ BLAST nội bộ (services/blast) – kiểm thử cùng bộ test của nền tảng.
import { ACCESSION, cleanSequence, parseOutfmt6, validateSequence } from "../../../../services/blast/server.mjs";

const prof = (o: Record<string, [string, string?]>): Profile => new Map(Object.entries(o).map(([m, [a, b]]) => [m, genotypeOf(a, b)]));

describe("kiểu gen", () => {
  it("cặp alen không thứ tự; alen 2 trống = đồng hợp", () => {
    expect(genotypeOf("124", "110")).toEqual(["110", "124"]);
    expect(genotypeOf("a")).toEqual(["A", "A"]);
  });
  it("tỷ lệ alen chung 1 / 0,5 / 0", () => {
    expect(alleleSharing(["110", "124"], ["110", "124"])).toBe(1);
    expect(alleleSharing(["110", "124"], ["110", "130"])).toBe(0.5);
    expect(alleleSharing(["110", "110"], ["110", "124"])).toBe(0.5);
    expect(alleleSharing(["110", "110"], ["124", "130"])).toBe(0);
  });
  it("so 2 hồ sơ trên chỉ thị chung", () => {
    const a = prof({ m1: ["110"], m2: ["124", "130"], m3: ["A"] });
    const b = prof({ m1: ["110"], m2: ["124", "136"], m4: ["G"] });
    expect(compareProfiles(a, b)).toEqual({ compared: 2, identical: 1, similarity: 0.75 });
  });
});

describe("nhận dạng & độ thuần", () => {
  const ref1 = prof({ m1: ["110"], m2: ["124"], m3: ["A"], m4: ["150", "160"] });
  const ref2 = prof({ m1: ["118"], m2: ["130"], m3: ["G"], m4: ["150"] });
  const references = [
    { id: "v1", label: "Giống 1", profile: ref1 },
    { id: "v2", label: "Giống 2", profile: ref2 },
  ];
  it("mẫu trùng khớp giống 1", () => {
    const r = identifySample(prof({ m1: ["110"], m2: ["124"], m3: ["A"], m4: ["160", "150"] }), references);
    expect(r[0]).toMatchObject({ similarity: 1, conclusion: "Trùng khớp" });
    expect(r[0].ref.id).toBe("v1");
    expect(r[1].conclusion).toBe("Khác giống");
  });
  it("ít hơn 3 chỉ thị chung → chưa đủ", () => {
    expect(identifySample(prof({ m1: ["110"], m2: ["124"] }), references)[0].conclusion).toBe("Chưa đủ chỉ thị");
  });
  it("độ thuần = cây khớp hoàn toàn ÷ cây đủ số liệu", () => {
    const plants = [
      { id: "p1", label: "C1", profile: prof({ m1: ["110"], m2: ["124"], m3: ["A"] }) },
      { id: "p2", label: "C2", profile: prof({ m1: ["110"], m2: ["124"], m3: ["A"] }) },
      { id: "p3", label: "C3", profile: prof({ m1: ["110"], m2: ["130"], m3: ["A"] }) },
      { id: "p4", label: "C4", profile: prof({ m1: ["110"] }) },
    ];
    const r = purityTest(plants, ref1);
    expect(r).toMatchObject({ tested: 3, trueToType: 2, purity: 66.7 });
    expect(r.offTypes.map((p) => p.label)).toEqual(["C3"]);
  });
  it("hồ sơ chuẩn gộp các mẫu tham chiếu của cùng giống", () => {
    const profiles = profilesBySample([
      { sampleId: "s1", markerId: "m1", allele1: "110", allele2: "" },
      { sampleId: "s2", markerId: "m2", allele1: "124", allele2: "130" },
      { sampleId: "s3", markerId: "m1", allele1: "999", allele2: "" },
    ]);
    const refs = referenceProfiles(
      [
        { id: "s1", purpose: "Giống tham chiếu", varietyId: "v" },
        { id: "s2", purpose: "Giống tham chiếu", varietyId: "v" },
        { id: "s3", purpose: "Mẫu cần nhận dạng", varietyId: "v" },
      ],
      profiles,
    );
    expect([...refs.get("v")!.entries()]).toEqual([["m1", ["110", "110"]], ["m2", ["124", "130"]]]);
  });
});

describe("nhập kiểu gen, tọa độ", () => {
  it("dán từ Excel có tiêu đề; báo lỗi theo dòng", () => {
    const r = parseGenotypeCsv("Mã mẫu\tMã chỉ thị\tAlen 1\tAlen 2\nS1\tRM190\t110\t110\nS1\tRM21\t124\t\nS2\tRM21\t\t\nS3\tRM21\t1;drop\t");
    expect(r.rows).toEqual([
      { sampleCode: "S1", markerCode: "RM190", allele1: "110", allele2: "110" },
      { sampleCode: "S1", markerCode: "RM21", allele1: "124", allele2: "" },
    ]);
    expect(r.errors.map((e) => e.line)).toEqual([4, 5]);
  });
  it("tọa độ trong lãnh thổ Việt Nam", () => {
    expect(validateCoordinates(19.807, 105.776)).toBeNull();
    expect(validateCoordinates(null, null)).toBeNull();
    expect(validateCoordinates(105.776, 19.807)).toMatch(/ngoài lãnh thổ/);
    expect(validateCoordinates(19.8, null)).toMatch(/đủ cả/);
  });
});

describe("dịch vụ BLAST nội bộ – kiểm tra đầu vào", () => {
  it("làm sạch FASTA, ARN → ADN", () => {
    expect(cleanSequence(">tieu de\nacgt acgu\n12 NN")).toBe("ACGTACGUNN");
    expect(validateSequence(">x\nACGU", "ARN")).toEqual({ seq: "ACGT" });
  });
  it("chỉ nhận ký hiệu IUPAC; chặn ký tự lạ", () => {
    expect(validateSequence("ACGT;rm -rf /", "ADN")).toHaveProperty("error");
    expect(validateSequence("MKV*", "Protein")).toEqual({ seq: "MKV*" });
    expect(validateSequence("ACGTOO", "ADN")).toHaveProperty("error");
    expect(validateSequence("", "ADN")).toEqual({ error: "Trình tự trống" });
  });
  it("mã trình tự an toàn cho tên tệp", () => {
    expect(ACCESSION.test("GIONG-A.ITS_1")).toBe(true);
    expect(ACCESSION.test("../etc/passwd")).toBe(false);
    expect(ACCESSION.test("a b")).toBe(false);
  });
  it("đọc kết quả -outfmt 6", () => {
    const hits = parseOutfmt6("GIONG-A.ITS\t99.333\t300\t2\t0\t1\t300\t101\t400\t5.74e-159\t544\t100\n");
    expect(hits).toEqual([
      { accession: "GIONG-A.ITS", identity: 99.333, length: 300, mismatches: 2, gaps: 0, qStart: 1, qEnd: 300, sStart: 101, sEnd: 400, evalue: 5.74e-159, bitscore: 544, queryCoverage: 100 },
    ]);
  });
});
