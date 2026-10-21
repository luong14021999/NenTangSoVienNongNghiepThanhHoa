import { TopBar } from "@/components/layout/topbar";
import { Sidebar } from "@/components/layout/sidebar";
import { ModuleScope } from "@/components/layout/module-scope";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ModuleScope className="flex flex-col h-[100dvh] w-full overflow-hidden bg-muted/30">
      <TopBar />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {children}
        </div>
      </div>
    </ModuleScope>
  );
}
