/** Biểu đồ cột đơn giản theo tháng (server component, không cần thư viện). `ghost`: cột dự báo (nhạt, viền nét đứt). */
export function Bars({
  months,
  values,
  fmt = String,
  ghost = [],
  height = "h-44",
}: {
  months: string[];
  values: number[];
  fmt?: (n: number) => string;
  ghost?: boolean[];
  height?: string;
}) {
  const max = Math.max(1, ...values);
  return (
    <div className={`flex items-end gap-1.5 sm:gap-2 ${height}`}>
      {months.map((m, i) => (
        <div key={m} className="flex-1 min-w-0 flex flex-col items-center gap-1 h-full justify-end">
          <span className="text-[10px] text-muted-foreground truncate max-w-full">{values[i] ? fmt(values[i]) : ""}</span>
          <div
            className={`w-full rounded-t ${ghost[i] ? "bg-primary/25 border border-dashed border-primary/60" : "bg-primary/80"}`}
            style={{ height: `${(values[i] / max) * 100}%`, minHeight: values[i] ? 2 : 0 }}
          />
          <span className={`text-[10px] ${ghost[i] ? "text-primary font-medium" : "text-muted-foreground"}`}>{m.slice(5)}/{m.slice(2, 4)}</span>
        </div>
      ))}
    </div>
  );
}
