import Link from "next/link";

/** Danh sách ngắn mã – mô tả dùng trong các thẻ liên kết của trang chi tiết M3. */
export function LinkList({ items, empty = "Chưa có" }: { items: { key: string; href: string; code: string; text: string }[]; empty?: string }) {
  return (
    <ul className="divide-y text-sm">
      {items.map((i) => (
        <li key={i.key} className="py-1.5 flex flex-wrap justify-between gap-2">
          <Link href={i.href} className="font-mono text-xs text-primary hover:underline">{i.code}</Link>
          <span className="text-xs text-muted-foreground">{i.text}</span>
        </li>
      ))}
      {items.length === 0 && <li className="py-1.5 text-xs text-muted-foreground">{empty}</li>}
    </ul>
  );
}
