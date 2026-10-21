// Màn hình làm việc M3.2 – cây phả hệ, ghép phối thử, bàn sản xuất & chứng nhận lô giống (hàm thuần).
import { INBREEDING_WARN, SEED_LEVELS, inbreeding, type PedigreeNode } from "./breeding-rules";

export type PedigreeSlot = { id: string | null; label: string };

const ROLE_NAMES: Record<string, string> = {
  B: "Bố",
  M: "Mẹ",
  BB: "Ông nội",
  BM: "Bà nội",
  MB: "Ông ngoại",
  MM: "Bà ngoại",
};

/** Nhãn quan hệ theo đường đi từ cá thể gốc: "B" = bố, "MB" = bố của mẹ (ông ngoại)… */
export function roleLabel(path: string) {
  if (ROLE_NAMES[path]) return ROLE_NAMES[path];
  return `Cụ (${path.split("").map((c) => (c === "B" ? "bố" : "mẹ")).join(" › ")})`;
}

/**
 * Lưới phả hệ: thế hệ g (1 = bố mẹ) có 2^g ô; ô thứ 2k là bố, 2k+1 là mẹ của ô k ở thế hệ trước.
 * Ô không rõ (chưa nhập) có id null để vẫn giữ đúng vị trí trên cây.
 */
export function pedigreeGrid(id: string, nodes: PedigreeNode[], generations = 3): PedigreeSlot[][] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const out: PedigreeSlot[][] = [];
  let prev: { id: string | null; path: string }[] = [{ id, path: "" }];
  for (let g = 1; g <= generations; g++) {
    const cur: { id: string | null; path: string }[] = [];
    for (const p of prev) {
      const n = p.id ? byId.get(p.id) : undefined;
      cur.push({ id: n?.sireId && byId.has(n.sireId) ? n.sireId : null, path: `${p.path}B` });
      cur.push({ id: n?.damId && byId.has(n.damId) ? n.damId : null, path: `${p.path}M` });
    }
    out.push(cur.map((c) => ({ id: c.id, label: roleLabel(c.path) })));
    prev = cur;
  }
  return out;
}

/** Tập tổ tiên (không gồm chính nó) tới `depth` đời. */
export function ancestorSet(id: string, nodes: PedigreeNode[], depth = 6) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const seen = new Set<string>();
  let frontier = [id];
  for (let d = 0; d < depth && frontier.length; d++) {
    const next: string[] = [];
    for (const f of frontier) {
      const n = byId.get(f);
      for (const p of [n?.sireId, n?.damId]) {
        if (!p || !byId.has(p) || seen.has(p)) continue;
        seen.add(p);
        next.push(p);
      }
    }
    frontier = next;
  }
  return seen;
}

/** Tổ tiên chung của hai cá thể (kể cả khi một bên là tổ tiên của bên kia). */
export function commonAncestors(a: string, b: string, nodes: PedigreeNode[], depth = 6) {
  const A = ancestorSet(a, nodes, depth).add(a);
  const B = ancestorSet(b, nodes, depth).add(b);
  return [...A].filter((x) => B.has(x) && x !== a && x !== b).concat(A.has(b) ? [b] : [], B.has(a) ? [a] : []);
}

export type MatingCandidate<T> = { partner: T; f: number; warn: boolean; common: string[] };

/**
 * Ghép phối thử: với một cá thể, xếp các cá thể khác giới đang sử dụng theo hệ số cận huyết của đời con
 * (= hệ số thân thuộc bố × mẹ, Wright) từ thấp đến cao. Cá thể chưa rõ giới tính → không có gợi ý.
 */
export function matingCandidates<T extends PedigreeNode & { sex: string; status: string; code: string }>(id: string, nodes: T[]) {
  const me = nodes.find((n) => n.id === id);
  const other = me?.sex === "Đực" ? "Cái" : me?.sex === "Cái" ? "Đực" : null;
  if (!other) return [];
  const F = inbreeding(nodes);
  return nodes
    .filter((n) => n.sex === other && n.status === "Đang sử dụng" && n.id !== id)
    .map<MatingCandidate<T>>((partner) => {
      const f = F.coancestry(partner.id, id);
      return { partner, f, warn: f >= INBREEDING_WARN, common: commonAncestors(partner.id, id, nodes) };
    })
    .sort((a, b) => a.f - b.f || a.partner.code.localeCompare(b.partner.code));
}

// ── Bàn sản xuất & chứng nhận lô giống ──────────────────────────────
/** Lượng còn lại của lô giống sau các phiếu giao. */
export function seedLotLeft(lot: { id: string; quantity: number }, deliveries: { seedLotId: string; quantity: number }[]) {
  const given = deliveries.filter((d) => d.seedLotId === lot.id).reduce((s, d) => s + (Number(d.quantity) || 0), 0);
  return Math.max(0, (Number(lot.quantity) || 0) - given);
}

/** Cấp giống sinh ra khi nhân tiếp từ một lô (cây trồng: SNC → NC → XN; vật nuôi: cụ kỵ → ông bà → bố mẹ → thương phẩm). */
export function nextLevel(level: string) {
  const chain = ["Giống tác giả", "Siêu nguyên chủng", "Nguyên chủng", "Xác nhận 1", "Xác nhận 2"];
  const animal = ["Giống cụ kỵ", "Giống ông bà", "Giống bố mẹ", "Giống thương phẩm"];
  for (const c of [chain, animal]) {
    const i = c.indexOf(level === "Xác nhận" ? "Xác nhận 1" : level);
    if (i >= 0) return c[Math.min(i + 1, c.length - 1)];
  }
  return level;
}

/**
 * Bậc thang cấp giống của một giống: mỗi cấp có số lô giống, số lô đã chứng nhận, lượng còn lại theo đơn vị
 * và số lô sản xuất đang làm; cấp cao xếp trên (theo thứ bậc SEED_LEVELS).
 */
export function levelSteps(
  seedLots: { id: string; level: string; status: string; quantity: number; unit: string }[],
  prodLots: { level: string; status: string }[],
  deliveries: { seedLotId: string; quantity: number }[],
) {
  const levels = [...new Set([...seedLots.map((l) => l.level), ...prodLots.filter((p) => p.status !== "Hủy").map((p) => p.level)].filter(Boolean))];
  const rank = (l: string) => {
    const r = SEED_LEVELS.find((x) => x.level === l)?.rank ?? -1;
    return r < 0 ? 99 : r;
  };
  return levels
    .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b, "vi"))
    .map((level) => {
      const lots = seedLots.filter((l) => l.level === level);
      return {
        level,
        lots: lots.length,
        certified: lots.filter((l) => l.status === "Đã chứng nhận").length,
        producing: prodLots.filter((p) => p.level === level && (p.status === "Kế hoạch" || p.status === "Đang sản xuất")).length,
        left: lots.filter((l) => l.status === "Đạt" || l.status === "Đã chứng nhận").map((l) => ({ quantity: seedLotLeft(l, deliveries), unit: l.unit })),
      };
    });
}
