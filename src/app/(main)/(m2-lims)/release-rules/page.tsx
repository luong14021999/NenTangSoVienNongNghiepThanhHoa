import Link from "next/link";
import { ShieldCheck, Ban, AlertTriangle, History } from "lucide-react";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatGrid } from "@/components/common/stat-grid";
import { DraftActions, RuleSetEditor } from "@/components/m2/release/rule-set-editor";
import { listRuleSets } from "@/lib/modules/m2/data/release-rules";
import { DEFAULT_RULES, RULE_INFO, levelOf, type ReleaseRules } from "@/lib/modules/m2/release-checks";

export const dynamic = "force-dynamic";
export const metadata = { title: "Quy tắc kiểm soát phát hành" };

const dt = (iso: string) =>
  iso ? new Date(iso).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short" }) : "—";

const levelBadge = { "Chặn": "destructive", "Cảnh báo": "warning", "Tắt": "secondary" } as const;

function threshold(rules: ReleaseRules, key: keyof ReleaseRules) {
  if (key === "rsd") return `≤ ${rules.rsd.max}%`;
  if (key === "recovery") return `${rules.recovery.min}–${rules.recovery.max}%`;
  return "";
}

function RuleTable({ rules, compare }: { rules: ReleaseRules; compare?: ReleaseRules }) {
  return (
    <div className="rounded-lg border divide-y">
      {RULE_INFO.map((info) => {
        const level = levelOf(rules, info.key);
        const before = compare ? `${levelOf(compare, info.key)} ${threshold(compare, info.key)}`.trim() : "";
        const now = `${level} ${threshold(rules, info.key)}`.trim();
        const changed = compare && before !== now;
        return (
          <div key={info.key} className={`px-4 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2 ${changed ? "bg-amber-50/60" : ""}`}>
            <div className="flex-1 text-sm">
              {info.label} <span className="text-[11px] text-muted-foreground">{info.clause}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {changed && <span className="text-muted-foreground line-through">{before}</span>}
              {threshold(rules, info.key) && <span className="font-mono">{threshold(rules, info.key)}</span>}
              <Badge variant={levelBadge[level]}>{level}</Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default async function ReleaseRulesPage() {
  const sets = await listRuleSets();
  const active = sets.find((s) => s.status === "Hiệu lực");
  const draft = sets.find((s) => s.status === "Dự thảo");
  const rules = active?.rules ?? DEFAULT_RULES;
  const count = (l: string) => RULE_INFO.filter((i) => levelOf(rules, i.key) === l).length;

  return (
    <>
      <Header
        title="Quy tắc kiểm soát trước phát hành"
        description="M2.5 – quy tắc do PTN ban hành, có phiên bản; mọi thay đổi phải được phê duyệt và lưu vết. Áp dụng khi nộp, duyệt, phê duyệt kết quả và phát hành phiếu"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Phiên bản hiệu lực", value: active ? `v${active.version}` : "—", icon: ShieldCheck, accent: "bg-emerald-50 text-emerald-700", hint: active ? `ban hành ${dt(active.approvedAt)}` : "" },
            { label: "Quy tắc mức Chặn", value: count("Chặn"), icon: Ban, accent: "bg-rose-50 text-rose-600" },
            { label: "Quy tắc mức Cảnh báo", value: count("Cảnh báo"), icon: AlertTriangle, accent: "bg-amber-50 text-amber-600" },
            { label: "Số phiên bản", value: sets.length, icon: History, accent: "bg-blue-50 text-blue-600" },
          ]}
        />

        {draft && (
          <Card className="border-amber-300">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Dự thảo phiên bản {draft.version} <Badge variant="warning">Chờ phê duyệt</Badge>
                </CardTitle>
                <CardDescription>
                  Soạn bởi {draft.createdBy} lúc {dt(draft.createdAt)} · {draft.changeNote}
                </CardDescription>
              </div>
              <DraftActions id={draft.id} />
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground mb-2">Dòng tô vàng = thay đổi so với v{active?.version} (giá trị cũ gạch ngang). Người phê duyệt phải khác người soạn.</div>
              <RuleTable rules={draft.rules} compare={active?.rules} />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between space-y-0">
            <div>
              <CardTitle>Phiên bản đang hiệu lực {active && `– v${active.version}`}</CardTitle>
              <CardDescription>
                {active ? `Ban hành bởi ${active.approvedBy} · ${active.changeNote}` : "Chưa có phiên bản hiệu lực – đang dùng bộ mặc định"}
                {" · "}Chặn = không cho nộp / phê duyệt / phát hành; Cảnh báo = cho phép nhưng ghi vào lưu vết
              </CardDescription>
            </div>
            <RuleSetEditor current={rules} disabled={Boolean(draft)} />
          </CardHeader>
          <CardContent>
            <RuleTable rules={rules} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lịch sử phiên bản</CardTitle>
            <CardDescription>
              Phiên bản đã ban hành không xoá được · chi tiết từng thay đổi xem ở{" "}
              <Link href="/change-log?entity=release-rules" className="text-primary hover:underline">nhật ký thay đổi</Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {sets.map((s) => (
                <li key={s.id} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-md border">
                  <span className="font-mono text-sm font-semibold w-12">v{s.version}</span>
                  <Badge variant={s.status === "Hiệu lực" ? "success" : s.status === "Dự thảo" ? "warning" : "secondary"}>{s.status}</Badge>
                  <span className="text-xs flex-1">{s.changeNote}</span>
                  <span className="text-[11px] text-muted-foreground">
                    Soạn: {s.createdBy} {dt(s.createdAt)}
                    {s.approvedBy && ` · Duyệt: ${s.approvedBy} ${dt(s.approvedAt)}`}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
