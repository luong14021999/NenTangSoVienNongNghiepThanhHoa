import type { ReactNode } from "react";
import Link from "next/link";
import { BookOpen, CalendarClock, FlaskConical, GraduationCap, Handshake } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtDateVN } from "@/lib/platform/dates";
import { compactVND } from "./format";

export type DeadlineItem = { id: string; href: string; title: string; taskCode: string; dueAt: string; days: number; kind: "Mốc" | "Kết thúc" };
export type TransferItem = { id: string; title: string; partner: string; signedAt: string; value: number; status: string };
export type TrainingItem = { id: string; title: string; startAt: string; status: string; planned: number; attended: number };

export type ResearchPanelData = {
  activeTasks: number;
  deadlines: DeadlineItem[];
  transfers: TransferItem[];
  trainings: TrainingItem[];
  knowledgeTotal: number | null;
  knowledgePublic: number | null;
};

function DueChip({ days }: { days: number }) {
  const tone =
    days < 0
      ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
      : days <= 14
        ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
        : "bg-muted text-muted-foreground";
  return (
    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums", tone)}>
      {days < 0 ? `trễ ${-days} ngày` : days === 0 ? "hôm nay" : `còn ${days} ngày`}
    </span>
  );
}

function Block({ icon: Icon, title, href, children }: { icon: typeof BookOpen; title: string; href: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
          {title}
        </h3>
        <Link href={href} className="text-[11px] text-primary hover:underline">Xem</Link>
      </div>
      {children}
    </div>
  );
}

/** Bảng phụ: nghiên cứu, chuyển giao – tập huấn, kho tri thức. */
export function ResearchPanel({ data }: { data: ResearchPanelData }) {
  return (
    <section aria-labelledby="research-title" className="space-y-5 rounded-xl border border-border bg-card p-4">
      <div>
        <h2 id="research-title" className="text-sm font-semibold">Nghiên cứu & tri thức</h2>
        <p className="text-xs text-muted-foreground">Nguồn sản phẩm cho dịch vụ chuyển giao</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Link href="/research-tasks" className="rounded-lg bg-accent p-3 hover:bg-accent/80">
          <p className="text-2xl font-bold tabular-nums text-accent-foreground">{data.activeTasks}</p>
          <p className="text-[11px] text-muted-foreground">Nhiệm vụ đang thực hiện</p>
        </Link>
        <Link href="/knowledge" className="rounded-lg bg-accent p-3 hover:bg-accent/80">
          <p className="text-2xl font-bold tabular-nums text-accent-foreground">{data.knowledgeTotal ?? "—"}</p>
          <p className="text-[11px] text-muted-foreground">
            Tài liệu tri thức{data.knowledgePublic !== null ? ` · ${data.knowledgePublic} công khai` : ""}
          </p>
        </Link>
      </div>

      <Block icon={CalendarClock} title="Hạn gần nhất" href="/research-tasks">
        <ul className="space-y-2">
          {data.deadlines.map((d) => (
            <li key={d.id}>
              <Link href={d.href} className="flex items-start justify-between gap-2 rounded-md p-1 -m-1 hover:bg-muted">
                <span className="min-w-0">
                  <span className="line-clamp-2 text-sm leading-snug">{d.title}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    <span className="font-mono">{d.taskCode}</span> · {d.kind === "Mốc" ? "Mốc" : "Kết thúc"} {fmtDateVN(d.dueAt)}
                  </span>
                </span>
                <DueChip days={d.days} />
              </Link>
            </li>
          ))}
          {data.deadlines.length === 0 && <li className="text-xs text-muted-foreground">Không có hạn sắp tới</li>}
        </ul>
      </Block>

      <Block icon={Handshake} title="Chuyển giao gần đây" href="/tech-transfers">
        <ul className="space-y-2">
          {data.transfers.map((t) => (
            <li key={t.id} className="flex items-start justify-between gap-2">
              <span className="min-w-0">
                <span className="line-clamp-1 text-sm">{t.title}</span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {t.partner || "—"} · {t.status}
                  {t.signedAt ? ` · ${fmtDateVN(t.signedAt)}` : ""}
                </span>
              </span>
              {t.value > 0 && <span className="shrink-0 text-xs font-semibold tabular-nums">{compactVND(t.value)}</span>}
            </li>
          ))}
          {data.transfers.length === 0 && <li className="text-xs text-muted-foreground">Chưa có hợp đồng chuyển giao</li>}
        </ul>
      </Block>

      <Block icon={GraduationCap} title="Tập huấn" href="/trainings">
        <ul className="space-y-2">
          {data.trainings.map((t) => (
            <li key={t.id} className="flex items-start justify-between gap-2">
              <span className="min-w-0">
                <span className="line-clamp-1 text-sm">{t.title}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {t.startAt ? fmtDateVN(t.startAt) : "Chưa xếp lịch"} · {t.status}
                </span>
              </span>
              <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                {t.status === "Đã tổ chức" ? `${t.attended}/${t.planned}` : `${t.planned}`} người
              </span>
            </li>
          ))}
          {data.trainings.length === 0 && <li className="text-xs text-muted-foreground">Chưa có lớp tập huấn</li>}
        </ul>
      </Block>

      <Link href="/research-stats" className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
        <FlaskConical className="h-3.5 w-3.5" aria-hidden />
        Thống kê nghiên cứu →
      </Link>
    </section>
  );
}
