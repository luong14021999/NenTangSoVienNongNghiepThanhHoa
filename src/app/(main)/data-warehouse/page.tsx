import Link from "next/link";
import { Download, Warehouse } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DATASETS, datasetCounts, datasetRows, isDataset } from "@/lib/data/system";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kho dữ liệu dùng chung" };

const show = (v: unknown) => (v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v));

export default async function DataWarehousePage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const { d = "fact_samples" } = await searchParams;
  const ds = isDataset(d) ? d : "fact_samples";
  const [counts, preview] = await Promise.all([datasetCounts(), datasetRows(ds, 20)]);
  const cols = preview.length ? Object.keys(preview[0]) : [];
  return (
    <>
      <Header title="Kho dữ liệu dùng chung" description="M1.4 – lớp dữ liệu phân tích (schema analytics) tổng hợp từ các phân hệ; chỉ đọc; nguồn cho dashboard, dự báo, API và LGSP" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {Object.entries(DATASETS).map(([k, v]) => (
            <Link key={k} href={`/data-warehouse?d=${k}`} className={`rounded-xl border bg-card p-4 hover:bg-accent/40 ${k === ds ? "ring-2 ring-primary" : ""}`}>
              <div className="flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">{v.name}</span>
                <Badge variant="outline" className="ml-auto text-[10px]">{v.module}</Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-1">{v.desc}</div>
              <div className="text-xs mt-2"><span className="font-mono">analytics.{k}</span> · <b>{counts[k]}</b> dòng</div>
            </Link>
          ))}
        </section>
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0">
            <div>
              <CardTitle className="text-base">{DATASETS[ds].name} <span className="font-mono text-xs text-muted-foreground">analytics.{ds}</span></CardTitle>
              <CardDescription>20 dòng đầu · {cols.length} cột · API: /api/v1/warehouse/{ds}</CardDescription>
            </div>
            <div className="flex gap-2">
              <a href={`/api/warehouse/${ds}`} className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md border text-xs font-medium hover:bg-accent"><Download className="w-3.5 h-3.5" /> CSV (Excel)</a>
              <a href={`/api/warehouse/${ds}?format=json`} target="_blank" className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md border text-xs font-medium hover:bg-accent">JSON</a>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border overflow-x-auto">
              <Table>
                <TableHeader><TableRow>{cols.map((c) => <TableHead key={c} className="font-mono text-[11px] whitespace-nowrap">{c}</TableHead>)}</TableRow></TableHeader>
                <TableBody>
                  {preview.length === 0 && <TableRow><TableCell className="text-sm text-muted-foreground py-6 text-center">Chưa có dữ liệu</TableCell></TableRow>}
                  {preview.map((r, i) => (
                    <TableRow key={i}>{cols.map((c) => <TableCell key={c} className="text-xs whitespace-nowrap max-w-[240px] truncate">{show(r[c])}</TableCell>)}</TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
