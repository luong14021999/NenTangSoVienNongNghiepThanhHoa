import { TopBar } from "@/components/layout/topbar";
import { ModuleFrame } from "@/components/layout/module-frame";
import { ModuleScope } from "@/components/layout/module-scope";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ModuleScope className="flex flex-col h-[100dvh] w-full overflow-hidden bg-muted/30">
      <TopBar />
      <ModuleFrame>{children}</ModuleFrame>
    </ModuleScope>
  );
}
