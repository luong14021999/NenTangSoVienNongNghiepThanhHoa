import { staffStore } from "@/lib/modules/m2/data/staff";
import { listRoute, createRoute } from "@/lib/platform/api/crud";
import type { Staff } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export const GET = listRoute(staffStore);

export const POST = createRoute<Staff>(
  staffStore,
  (body) => ({
    id: "",
    code: body.code ?? "",
    fullName: body.fullName ?? "",
    position: body.position ?? "",
    department: body.department ?? "",
    email: body.email ?? "",
    phone: body.phone ?? "",
    joinedAt: body.joinedAt ?? new Date().toISOString().slice(0, 10),
    competencies: body.competencies ?? [],
    trainings: body.trainings ?? [],
    status: body.status ?? "Đang làm việc",
  }),
  (body) => {
    if (!body.code) return "Thiếu mã NV";
    if (!body.fullName) return "Thiếu họ tên";
    return null;
  },
);
