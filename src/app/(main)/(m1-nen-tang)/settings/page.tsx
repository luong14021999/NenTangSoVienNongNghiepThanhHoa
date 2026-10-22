import Link from "next/link";
import { Building2, ChevronRight, History, KeyRound, Lock, Microscope, Settings2, type LucideIcon } from "lucide-react";
import { Header } from "@/components/layout/header";
import { SettingsForm } from "@/components/platform/settings-form";
import { labInfo } from "@/lib/modules/m2/accreditation";
import { currentAccess } from "@/lib/platform/data/access";
import { listChanges } from "@/lib/platform/data/change-log";
import { SETTINGS, SETTING_GROUPS, getSettings, type SettingGroup, type SettingKey } from "@/lib/platform/data/settings";
import { fmtDateTimeVN } from "@/lib/platform/dates";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cấu hình hệ thống" };

const GROUP_ICON: Record<SettingGroup, LucideIcon> = { security: Lock, integration: KeyRound, operations: Settings2, tissue: Microscope };
/** Mục chỉ đọc / lịch sử ở cuối cột trái. */
const EXTRA = [
  { key: "org", label: "Thông tin đơn vị", hint: "Hiện trên phiếu kết quả, báo giá", icon: Building2 },
  { key: "history", label: "Lịch sử thay đổi", hint: "Ai sửa, sửa gì, khi nào", icon: History },
] as const;
type Section = SettingGroup | (typeof EXTRA)[number]["key"];

/** M1.8 – cấu hình hệ thống, bố cục 2 cột: nhóm cấu hình bên trái, nội dung bên phải. */
export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const sp = await searchParams;
  const groups = Object.keys(SETTING_GROUPS) as SettingGroup[];
  const section: Section = [...groups, ...EXTRA.map((e) => e.key)].includes(sp.s as Section) ? (sp.s as Section) : "security";
  const [access, settings, changes] = await Promise.all([currentAccess(), getSettings(), listChanges({ entity: "settings", limit: 30 }).catch(() => [])]);
  const admin = access.can("admin.system");
  const keysOf = (g: SettingGroup) => (Object.keys(SETTINGS) as SettingKey[]).filter((k) => SETTINGS[k].group === g);
  const changedCount = (g: SettingGroup) => keysOf(g).filter((k) => settings._meta[k]).length;

  let content;
  if ((groups as string[]).includes(section)) {
    const g = section as SettingGroup;
    const defs = keysOf(g).map((k) => ({ key: k, label: SETTINGS[k].label, type: SETTINGS[k].type, value: settings[k], updatedBy: settings._meta[k]?.updatedBy }));
    const last = keysOf(g).map((k) => settings._meta[k]).filter(Boolean).sort((a, b) => (b!.updatedAt || "").localeCompare(a!.updatedAt || ""))[0];
    content = (
      <>
        <header className="border-b pb-3">
          <h2 className="text-lg font-semibold">{SETTING_GROUPS[g].label}</h2>
          <p className="text-sm text-muted-foreground">{SETTING_GROUPS[g].hint}{last ? ` · sửa lần cuối ${fmtDateTimeVN(last.updatedAt)} bởi ${last.updatedBy}` : " · đang dùng giá trị mặc định"}</p>
        </header>
        <div className="pt-4">
          <SettingsForm key={g} defs={defs} disabled={!admin} />
          {!admin && <p className="mt-3 text-xs text-muted-foreground">Chỉ tài khoản có vai trò Quản trị được sửa cấu hình.</p>}
        </div>
      </>
    );
  } else if (section === "org") {
    const rows: [string, string][] = [
      ["Cơ quan", "Viện Nông nghiệp tỉnh Thanh Hóa"],
      ["Phòng thí nghiệm", "Phòng phân tích Đất, nước, phân bón và môi trường"],
      ["Mã VILAS", labInfo.vilasCode],
      ["Người quản lý PTN", labInfo.manager],
      ["Địa chỉ", labInfo.address],
      ["Điện thoại", labInfo.phone],
      ["Email", labInfo.email],
      ["Website", labInfo.website],
      ["Định dạng mã mẫu", "{YY}{MM}{DD}-{số phiếu trong tháng:2}/{số mẫu trong phiếu} – VD 260626-12/3"],
    ];
    content = (
      <>
        <header className="border-b pb-3">
          <h2 className="text-lg font-semibold">Thông tin đơn vị</h2>
          <p className="text-sm text-muted-foreground">Dùng trên phiếu kết quả, nhãn mẫu, báo giá và cổng công khai. Thông tin này theo hồ sơ công nhận VILAS nên được cố định trong hệ thống – cần thay đổi xin liên hệ đơn vị phát triển.</p>
        </header>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 pt-4 text-sm sm:grid-cols-[12rem_1fr]">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className={k === "Định dạng mã mẫu" ? "font-mono text-xs" : ""}>{v || "—"}</dd>
            </div>
          ))}
        </dl>
      </>
    );
  } else {
    content = (
      <>
        <header className="border-b pb-3">
          <h2 className="text-lg font-semibold">Lịch sử thay đổi cấu hình</h2>
          <p className="text-sm text-muted-foreground">30 lần sửa gần nhất · đầy đủ ở <Link href="/change-log" className="text-primary hover:underline">Nhật ký thay đổi</Link></p>
        </header>
        {changes.length === 0 ? (
          <p className="pt-4 text-sm text-muted-foreground">Chưa có thay đổi nào – hệ thống đang dùng giá trị mặc định.</p>
        ) : (
          <ol className="space-y-3 pt-4">
            {changes.map((c) => (
              <li key={c.id} className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">{fmtDateTimeVN(c.at)} · {c.actor || "hệ thống"}</div>
                <ul className="mt-1 space-y-0.5 text-sm">
                  {c.changes.map((x, i) => (
                    <li key={i}>
                      <span className="font-medium">{SETTINGS[x.field as SettingKey]?.label ?? x.field}</span>: <span className="text-muted-foreground line-through">{x.old || "∅"}</span> → <span>{x.new || "∅"}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </>
    );
  }

  const navItem = (key: Section, label: string, hint: string, Icon: LucideIcon, badge?: string) => (
    <li key={key}>
      <Link href={key === "security" ? "/settings" : `/settings?s=${key}`} aria-current={section === key ? "page" : undefined} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5", section === key ? "bg-primary/10 text-primary" : "hover:bg-accent")}>
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", section === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}><Icon className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block text-sm font-medium">{label}</span>
          <span className="block truncate text-[11px] text-muted-foreground">{hint}</span>
        </span>
        {badge && <span className="text-[10px] text-muted-foreground">{badge}</span>}
        <ChevronRight className="h-4 w-4 text-muted-foreground lg:hidden" />
      </Link>
    </li>
  );

  return (
    <>
      <Header title="Cấu hình hệ thống" description="Tham số dùng chung của nền tảng – mọi thay đổi được ghi nhật ký" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin">
        <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <nav aria-label="Nhóm cấu hình" className="rounded-xl border bg-card p-2 lg:sticky lg:top-0 lg:self-start">
            <ul className="space-y-0.5">
              {groups.map((g) => navItem(g, SETTING_GROUPS[g].label, SETTING_GROUPS[g].hint, GROUP_ICON[g], `${changedCount(g)}/${keysOf(g).length} đã đặt`))}
            </ul>
            <div className="my-2 border-t" />
            <ul className="space-y-0.5">{EXTRA.map((e) => navItem(e.key, e.label, e.hint, e.icon))}</ul>
          </nav>
          <section className="min-w-0 rounded-xl border bg-card p-4 sm:p-6">{content}</section>
        </div>
      </main>
    </>
  );
}
