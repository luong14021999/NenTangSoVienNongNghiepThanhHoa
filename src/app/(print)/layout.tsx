export default function PrintLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-[100dvh] bg-muted/40 print:bg-white">{children}</div>;
}
