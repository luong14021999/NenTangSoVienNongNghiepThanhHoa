// Đặc tả OpenAPI 3.0 của API v1 (M1.3) – nguồn duy nhất cho trang tài liệu và /api/v1/openapi.json.
import { API_SCOPES } from "@/lib/integration/api-keys";
import { DATASETS } from "@/lib/data/system";

const err = { $ref: "#/components/responses/Error" };
const std = { "401": err, "403": err, "429": err };
const pathParam = (name: string, desc: string) => ({ name, in: "path", required: true, description: desc, schema: { type: "string" } });

export type Endpoint = { method: "GET" | "POST"; path: string; scope: string | null; summary: string };

export function openApiSpec(serverUrl: string) {
  return {
    openapi: "3.0.3",
    info: {
      title: "API Viện Nông nghiệp tỉnh Thanh Hóa – Nền tảng dùng chung",
      version: "1.0.0",
      description:
        "API cho hệ thống bên ngoài và LGSP / NDXP. Xác thực bằng khóa API (header X-API-Key hoặc Authorization: Bearer). Mỗi khóa có phạm vi (scope) và giới hạn tần suất. Lỗi trả về { error, code }.",
    },
    servers: [{ url: `${serverUrl}/api/v1` }],
    security: [{ ApiKey: [] }],
    components: {
      securitySchemes: { ApiKey: { type: "apiKey", in: "header", name: "X-API-Key", description: `Phạm vi: ${Object.entries(API_SCOPES).map(([k, v]) => `${k} (${v})`).join("; ")}` } },
      responses: {
        Error: { description: "Lỗi", content: { "application/json": { schema: { type: "object", properties: { error: { type: "string" }, code: { type: "string" } } } } } },
      },
    },
    paths: {
      "/health": { get: { summary: "Kiểm tra sống", security: [], responses: { "200": { description: "OK" } } } },
      "/catalogs": { get: { summary: "Danh sách danh mục dùng chung", "x-scope": "catalogs:read", responses: { "200": { description: "OK" }, ...std } } },
      "/catalogs/{code}": {
        get: {
          summary: "Các mục của một danh mục (mặc định chỉ mục còn hiệu lực)",
          "x-scope": "catalogs:read",
          parameters: [pathParam("code", "Mã danh mục, VD PHEP_THU"), { name: "includeInactive", in: "query", schema: { type: "boolean" } }],
          responses: { "200": { description: "OK" }, "404": err, ...std },
        },
      },
      "/tests": { get: { summary: "Danh mục 59 phép thử VILAS 1501", "x-scope": "tests:read", responses: { "200": { description: "OK" }, ...std } } },
      "/reports/{code}": {
        get: { summary: "Xác minh phiếu kết quả (trạng thái, mã băm, toàn vẹn)", "x-scope": "reports:verify", parameters: [pathParam("code", "Mã phiếu")], responses: { "200": { description: "OK" }, "404": err, ...std } },
      },
      "/samples/{code}": {
        get: { summary: "Trạng thái mẫu (không có thông tin khách hàng / kết quả)", "x-scope": "samples:status", parameters: [pathParam("code", "Mã mẫu")], responses: { "200": { description: "OK" }, "404": err, ...std } },
      },
      "/stats": {
        get: { summary: "Số liệu tổng hợp theo tháng", "x-scope": "stats:read", parameters: [{ name: "month", in: "query", schema: { type: "string", example: "2026-10" } }], responses: { "200": { description: "OK" }, "400": err, ...std } },
      },
      "/warehouse/{dataset}": {
        get: {
          summary: "Đọc tập dữ liệu kho dữ liệu (phân trang)",
          "x-scope": "warehouse:read",
          parameters: [
            { ...pathParam("dataset", "Tập dữ liệu"), schema: { type: "string", enum: Object.keys(DATASETS) } },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 1000, default: 100 } },
            { name: "offset", in: "query", schema: { type: "integer", minimum: 0, default: 0 } },
          ],
          responses: { "200": { description: "OK" }, "404": err, ...std },
        },
      },
      "/lgsp/inbound": {
        post: {
          summary: "Nhận thông điệp từ LGSP / NDXP, trả biên nhận",
          "x-scope": "lgsp:inbound",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", required: ["header"], properties: { header: { type: "object", properties: { maGiaoDich: { type: "string" }, dichVu: { type: "string" }, kenh: { type: "string", enum: ["LGSP", "NDXP"] } } }, data: {} } } } },
          },
          responses: { "202": { description: "Đã tiếp nhận" }, "400": err, ...std },
        },
      },
    },
  };
}

/** Danh sách endpoint rút gọn cho trang tài liệu. */
export function endpoints(): Endpoint[] {
  const spec = openApiSpec("");
  return Object.entries(spec.paths).flatMap(([path, ops]) =>
    Object.entries(ops as Record<string, { summary: string; "x-scope"?: string }>).map(([m, op]) => ({ method: m.toUpperCase() as Endpoint["method"], path, scope: op["x-scope"] ?? null, summary: op.summary })),
  );
}
