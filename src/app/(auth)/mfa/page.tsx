import Image from "next/image";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { auth } from "@/lib/platform/auth/server";
import { MfaPanel } from "@/components/platform/mfa-panel";
import { SignOutLink } from "@/components/platform/sign-out-link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Xác thực 2 lớp" };

export default async function MfaPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (auth) {
    const { data } = await auth.getSession();
    if (!data?.user) redirect("/login");
  }
  const { next = "/" } = await searchParams;
  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center text-center gap-3">
          <Image src="/logo-vnnth.png" alt="Viện Nông nghiệp tỉnh Thanh Hóa" width={80} height={80} className="w-20 h-20 object-contain" priority />
          <h1 className="text-xl font-bold flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-primary" /> Xác thực 2 lớp</h1>
        </div>
        <MfaPanel mode="gate" next={next} />
        <div className="text-center"><SignOutLink /></div>
      </div>
    </div>
  );
}
