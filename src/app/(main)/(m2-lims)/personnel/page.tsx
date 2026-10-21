import {
  Users,
  UserPlus,
  GraduationCap,
  Mail,
  Phone,
  Building2,
} from "lucide-react";
import { staffStore } from "@/lib/modules/m2/data/staff";
import { AddStaffDialog } from "@/components/m2/staff/add-staff-dialog";
import { EditStaffDialog } from "@/components/m2/staff/edit-staff-dialog";
import { DeleteEntityButton } from "@/components/crud/delete-button";
import { EntitySearchInput } from "@/components/crud/search-input";

export const dynamic = "force-dynamic";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const statusVariant = {
  "Đang làm việc": "success",
  "Nghỉ phép": "warning",
  "Thử việc": "secondary",
} as const;

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

export default async function PersonnelPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const all = await staffStore.list();
  const query = q.trim().toLowerCase();
  const staff = query
    ? all.filter(
        (s) =>
          s.fullName.toLowerCase().includes(query) ||
          s.code.toLowerCase().includes(query) ||
          s.department.toLowerCase().includes(query) ||
          s.position.toLowerCase().includes(query),
      )
    : all;

  const departments = Array.from(new Set(all.map((s) => s.department)));

  const stats = [
    {
      label: "Tổng nhân sự PTN",
      value: all.length,
      icon: Users,
      accent: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Đang làm việc",
      value: all.filter((s) => s.status === "Đang làm việc").length,
      icon: Building2,
      accent: "bg-blue-50 text-blue-600",
    },
    {
      label: "Nhóm chuyên môn",
      value: departments.length,
      icon: GraduationCap,
      accent: "bg-violet-50 text-violet-600",
    },
    {
      label: "Thử việc",
      value: all.filter((s) => s.status === "Thử việc").length,
      icon: UserPlus,
      accent: "bg-amber-50 text-amber-600",
    },
  ];


  return (
    <>
      <Header
        title="Quản lý nhân sự PTN"
        description="Danh sách nhân sự, sơ đồ tổ chức, phiếu theo dõi nhân sự và năng lực chuyên môn"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5 flex items-start justify-between">
                <div>
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    {s.label}
                  </div>
                  <div className="text-3xl font-semibold mt-1.5">{s.value}</div>
                </div>
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.accent}`}
                >
                  <s.icon className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section>
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0">
              <div>
                <CardTitle>Danh sách nhân sự</CardTitle>
                <CardDescription>
                  Tổng {staff.length} nhân sự thuộc {departments.length} nhóm
                  chuyên môn
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <EntitySearchInput
                  basePath="/personnel"
                  placeholder="Tìm tên, mã, nhóm..."
                />
                <AddStaffDialog />
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50 border-0">
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Nhân sự
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Chức danh
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Nhóm chuyên môn
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Liên hệ
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Vào làm
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Trạng thái
                      </TableHead>
                      <TableHead className="w-[160px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-sm text-muted-foreground py-10"
                        >
                          {query
                            ? `Không có nhân sự nào khớp "${query}"`
                            : "Chưa có nhân sự nào"}
                        </TableCell>
                      </TableRow>
                    )}
                    {staff.map((s) => (
                      <TableRow
                        key={s.id}
                        className="hover:bg-primary/[0.04] transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                              {initials(s.fullName)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium truncate">
                                {s.fullName}
                              </div>
                              <div className="text-xs text-muted-foreground font-mono">
                                {s.code}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{s.position}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal">
                            {s.department}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-0.5">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Mail className="w-3 h-3 shrink-0" />
                              {s.email}
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Phone className="w-3 h-3 shrink-0" />
                              {s.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {s.joinedAt}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[s.status]}>
                            {s.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1.5">
                            <EditStaffDialog row={s} />
                            <DeleteEntityButton
                              entity="staff"
                              id={s.id}
                              label={s.fullName}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}
