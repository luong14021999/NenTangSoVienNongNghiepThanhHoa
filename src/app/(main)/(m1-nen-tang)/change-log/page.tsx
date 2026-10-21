import Link from "next/link";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ENTITY_LABELS, listChanges } from "@/lib/platform/data/change-log";
import { dbQuery, isDbConfigured } from "@/lib/platform/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nhật ký thay đổi" };

const dt = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "medium" });

const actionVariant = (a: string) =>
  a.startsWith("Xoá") || a.startsWith("Huỷ") ? "destructive" : a.startsWith("Thêm") || a.startsWith("Phát hành") ? "success" : a.startsWith("Phê duyệt") ? "default" : "warning";

/** Giá trị dài (JSON bản ghi bị xoá…) rút gọn để dễ đọc. */
const short = (v: string) => (v.length > 160 ? `${v.slice(0, 159)}…` : v);

export default async function ChangeLogPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string }>;
}) {
  const { entity = "" } = await searchParams;
  const [entries, counts] = await Promise.all([
    listChanges({ entity: entity || undefined, limit: 300 }),
    isDbConfigured()
      ? dbQuery(`select entity, count(*)::int n from public.change_log group by entity order by n desc`)
      : Promise.resolve([]),
  ]);
  const total = counts.reduce((s, c) => s + Number(c.n), 0);

  return (
    <>
      <Header
        title="Nhật ký thay đổi hệ thống"
        description="ISO/IEC 17025:2017 §7.11.3, §8.4 – mọi thêm / sửa / xoá trên phần mềm: người thực hiện, thời điểm, giá trị cũ → mới. Kết quả phân tích có lưu vết riêng trong từng phiếu"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <div className="flex flex-wrap gap-1.5">
          <Link
            href="/change-log"
            className={`h-8 px-3 inline-flex items-center rounded-full border text-xs font-medium ${!entity ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}
          >
            Tất cả <span className="ml-1.5 opacity-70">{total}</span>
          </Link>
          {counts.map((c) => (
            <Link
              key={c.entity as string}
              href={`/change-log?entity=${encodeURIComponent(c.entity as string)}`}
              className={`h-8 px-3 inline-flex items-center rounded-full border text-xs font-medium ${entity === c.entity ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}
            >
              {ENTITY_LABELS[c.entity as string] ?? (c.entity as string)} <span className="ml-1.5 opacity-70">{c.n as number}</span>
            </Link>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{entity ? ENTITY_LABELS[entity] ?? entity : "Tất cả thay đổi"}</CardTitle>
            <CardDescription>300 thay đổi gần nhất · nhật ký chỉ được ghi thêm, không sửa / xoá từ phần mềm</CardDescription>
          </CardHeader>
          <CardContent>
            {entries.length === 0 && <div className="text-sm text-muted-foreground py-6 text-center">Chưa có thay đổi nào được ghi nhận</div>}
            <ol className="space-y-2.5">
              {entries.map((e) => (
                <li key={e.id} className="rounded-md border p-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant={actionVariant(e.action)}>{e.action}</Badge>
                    <span className="text-xs text-muted-foreground">{ENTITY_LABELS[e.entity] ?? e.entity}</span>
                    <span className="font-medium">{e.label}</span>
                    <span className="ml-auto text-[11px] text-muted-foreground">{e.actor} · {dt(e.at)}</span>
                  </div>
                  {e.changes.length > 0 && (
                    <ul className="mt-2 space-y-0.5 text-xs font-mono">
                      {e.changes.map((c, i) => (
                        <li key={i} className="break-all">
                          <span className="text-muted-foreground font-sans">{c.field}:</span>{" "}
                          {c.old && <span className="text-rose-700 line-through">{short(c.old)}</span>}
                          {c.old && c.new && " → "}
                          {c.new && <span className="text-emerald-700">{short(c.new)}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
