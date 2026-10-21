// Kết nối dịch vụ BLAST+ nội bộ (services/blast). Chỉ chạy phía server.
// Không có chế độ mô phỏng: kết quả đối soát giả có thể dẫn tới kết luận sai về nguồn gen.

const base = () => (process.env.BLAST_SERVICE_URL ?? "").replace(/\/$/, "");
const token = () => process.env.BLAST_SERVICE_TOKEN ?? "";

export const blastConfigured = () => Boolean(base() && token());

async function call<T>(path: string, init: RequestInit = {}, timeoutMs = 130_000): Promise<T> {
  if (!blastConfigured()) throw new Error("Chưa kết nối dịch vụ BLAST+ nội bộ (đặt BLAST_SERVICE_URL, BLAST_SERVICE_TOKEN)");
  const res = await fetch(`${base()}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}`, ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(body.error ?? `Dịch vụ BLAST trả lỗi HTTP ${res.status}`);
  return body;
}

export async function blastHealth() {
  if (!blastConfigured()) return { connected: false as const, message: "Chưa kết nối" };
  try {
    const h = await call<{ blast: string; nucl: number; prot: number }>("/health", {}, 10_000);
    return { connected: true as const, ...h };
  } catch (e) {
    return { connected: false as const, message: (e as Error).message };
  }
}

export const blastAddSequence = (b: { accession: string; molecule: string; sequence: string }) =>
  call<{ accession: string; molecule: string; length: number; sha256: string }>("/sequences", { method: "POST", body: JSON.stringify(b) });

export const blastDeleteSequence = (accession: string) => call<{ ok: true }>(`/sequences/${encodeURIComponent(accession)}`, { method: "DELETE" });

export const blastSearch = (b: { program: string; query: string; evalue: number; maxHits: number }) =>
  call<{ program: string; queryLength: number; querySha256?: string; hits: import("@/lib/modules/m3/data/genomics").BlastHit[] }>("/search", {
    method: "POST",
    body: JSON.stringify(b),
  });
