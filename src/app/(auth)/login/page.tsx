import { Suspense } from "react";
import Image from "next/image";
import {
  Sprout,
  FlaskConical,
  TestTube,
  Beaker,
  Leaf,
  Wheat,
  Award,
} from "lucide-react";
import { redirect } from "next/navigation";
import { auth, getSessionSafe } from "@/lib/platform/auth/server";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Đăng nhập – Nền tảng số Viện Nông nghiệp tỉnh Thanh Hóa",
};

export default async function LoginPage() {
  // Đã đăng nhập → về trang chủ.
  if (auth) {
    const { data: session } = await getSessionSafe();
    if (session?.user) redirect("/");
  }

  return (
    <div className="min-h-[100dvh] flex">
      {/* LEFT: form panel */}
      <div className="flex-1 lg:max-w-[560px] flex flex-col justify-center px-6 sm:px-12 py-10 bg-background">
        <div className="w-full max-w-sm mx-auto">
          <div className="flex flex-col items-center text-center gap-4 mb-10">
            <div className="w-40 h-40 rounded-full bg-white ring-1 ring-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
              <Image
                src="/logo-vnnth.png"
                alt="Viện Nông nghiệp tỉnh Thanh Hóa"
                width={160}
                height={160}
                className="w-40 h-40 object-contain"
                priority
              />
            </div>
            <div className="leading-tight">
              <div className="text-xl font-bold text-foreground">
                Nền tảng số Viện Nông nghiệp tỉnh Thanh Hóa
              </div>
              <div className="text-sm text-muted-foreground">
                Một tài khoản cho tất cả phân hệ
              </div>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Đăng nhập hệ thống
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Chưa có tài khoản?{" "}
            <span className="text-primary font-medium">
              Liên hệ quản trị hệ thống để được cấp
            </span>
          </p>

          <div className="mt-8">
            <Suspense fallback={<div className="h-[280px]" />}>
              <LoginForm />
            </Suspense>
          </div>

          <div className="mt-10 pt-6 border-t border-border">
            <div className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider mb-2">
              Tuân thủ tiêu chuẩn
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1">
                <Award className="w-3 h-3 text-primary" />
                ISO/IEC 17025:2017
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1">
                Mã VILAS 1501
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: green agriculture-lab panel (hidden on mobile) */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        {/* Gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, hsl(145 62% 32%) 0%, hsl(150 55% 24%) 50%, hsl(155 60% 16%) 100%)",
          }}
        />

        {/* Decorative pattern overlay */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.07]"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="leaf-grid"
              x="0"
              y="0"
              width="80"
              height="80"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(30)"
            >
              <path
                d="M 20 40 Q 40 10, 60 40 Q 40 70, 20 40 Z"
                fill="white"
              />
              <circle cx="70" cy="10" r="2" fill="white" />
              <circle cx="10" cy="70" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#leaf-grid)" />
        </svg>

        {/* Floating icons */}
        <div className="absolute inset-0 text-white/10">
          <FlaskConical className="absolute w-24 h-24 top-16 right-16 rotate-12" />
          <TestTube className="absolute w-20 h-20 top-52 left-24 -rotate-6" />
          <Beaker className="absolute w-28 h-28 bottom-24 right-32 rotate-6" />
          <Leaf className="absolute w-20 h-20 bottom-40 left-20 rotate-45" />
          <Wheat className="absolute w-24 h-24 top-1/2 right-8 -rotate-12" />
          <Sprout className="absolute w-16 h-16 top-32 left-1/2 -rotate-6" />
        </div>

        {/* Center content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center items-center text-center px-16 text-white">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur ring-1 ring-white/40 flex items-center justify-center mb-6">
            <Sprout className="w-8 h-8" />
          </div>
          <h2 className="text-3xl xl:text-4xl font-bold leading-tight">
            Nền tảng số
            <br />
            Viện Nông nghiệp
          </h2>
          <p className="mt-4 text-white/80 text-sm max-w-md leading-relaxed">
            Phòng thí nghiệm VILAS&nbsp;1501 theo ISO/IEC&nbsp;17025:2017 · dịch vụ
            khoa học &amp; công nghệ · nuôi cấy mô · giống cây trồng, vật nuôi,
            thủy sản – dữ liệu dùng chung, một lần đăng nhập.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-6 text-center max-w-md">
            <div>
              <div className="text-2xl xl:text-3xl font-bold">5</div>
              <div className="text-[11px] uppercase tracking-wider text-white/70 mt-1">
                Phân hệ
              </div>
            </div>
            <div>
              <div className="text-2xl xl:text-3xl font-bold">59</div>
              <div className="text-[11px] uppercase tracking-wider text-white/70 mt-1">
                Phép thử VILAS
              </div>
            </div>
            <div>
              <div className="text-2xl xl:text-3xl font-bold">1</div>
              <div className="text-[11px] uppercase tracking-wider text-white/70 mt-1">
                Tài khoản dùng chung
              </div>
            </div>
          </div>
        </div>

        {/* Bottom credit */}
        <div className="absolute bottom-6 left-0 right-0 text-center text-[11px] text-white/50">
          © {new Date().getFullYear()} Viện Nông nghiệp tỉnh Thanh Hóa · 271
          Nguyễn Thục, phường Đông Quang, tỉnh Thanh Hoá · ĐT 02373.952.119
        </div>
      </div>
    </div>
  );
}
