import { Suspense } from "react";
import Image from "next/image";
import { Boxes, FlaskConical, Handshake, KeyRound, Microscope, ShieldCheck, Sprout, type LucideIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { auth, getSessionSafe } from "@/lib/platform/auth/server";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Đăng nhập – Nền tảng số Viện Nông nghiệp tỉnh Thanh Hóa",
};

/** 5 phần mềm của nền tảng – màu đồng bộ với ô vuông ở trang chủ. */
const SOFTWARE: { code: string; name: string; desc: string; icon: LucideIcon; tone: string }[] = [
  { code: "M1", name: "Nền tảng dùng chung", desc: "Tài khoản, danh mục, kết nối LGSP/NDXP, điều hành", icon: Boxes, tone: "from-sky-400 to-blue-600" },
  { code: "M2", name: "Phòng thí nghiệm (LIMS)", desc: "Phân tích đất, nước, phân bón – VILAS 1501", icon: FlaskConical, tone: "from-emerald-400 to-teal-600" },
  { code: "M3.1", name: "Nuôi cấy mô & truy xuất", desc: "Nhân giống in vitro, vườn ươm, mã QR nguồn gốc", icon: Microscope, tone: "from-violet-400 to-purple-600" },
  { code: "M3.2", name: "Giống cây trồng, vật nuôi, thủy sản", desc: "Hồ sơ giống, khảo nghiệm, sản xuất theo cấp", icon: Sprout, tone: "from-lime-400 to-green-600" },
  { code: "M4", name: "Nghiên cứu – dịch vụ – KH&CN", desc: "Dịch vụ khách hàng, nhiệm vụ KH&CN, kho tri thức", icon: Handshake, tone: "from-amber-400 to-orange-500" },
];
/** Ảnh ghép nền panel phải (cùng bộ ảnh với trang chủ). */
const PHOTOS = ["/modules/m2-phong-thi-nghiem.jpg", "/modules/m3-1-nuoi-cay-mo.jpg", "/modules/m3-2-giong.jpg", "/modules/m4-nghien-cuu-dich-vu.jpg"];

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
                Một tài khoản cho tất cả phần mềm
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

          <div className="mt-10 pt-6 border-t border-border space-y-2 text-xs text-muted-foreground">
            <p className="flex items-start gap-2"><KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />Một tài khoản dùng cho cả 5 phần mềm; quyền truy cập theo vai trò được giao.</p>
            <p className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />Hỗ trợ xác thực 2 lớp; mọi thao tác được ghi nhật ký.</p>
            {/* Điện thoại: không có panel phải – liệt kê ngắn các phần mềm */}
            <div className="flex flex-wrap gap-1.5 pt-2 lg:hidden">
              {SOFTWARE.map((m) => (
                <span key={m.code} className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5"><m.icon className="h-3 w-3 text-primary" />{m.code}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: ảnh hoạt động của Viện + 5 phần mềm (ẩn trên điện thoại) */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-[hsl(152_55%_14%)]">
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2" aria-hidden>
          {PHOTOS.map((src) => (
            <div key={src} className="relative">
              <Image src={src} alt="" fill sizes="30vw" className="object-cover" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(150_60%_20%/0.92)] via-[hsl(152_55%_16%/0.88)] to-[hsl(158_60%_10%/0.95)]" aria-hidden />

        <div className="relative z-10 flex flex-1 flex-col justify-center px-12 xl:px-20 py-12 text-white">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">Viện Nông nghiệp tỉnh Thanh Hóa</div>
          <h2 className="mt-2 text-3xl xl:text-4xl font-bold leading-tight">
            Nền tảng số
            <br />
            Viện Nông nghiệp Thanh Hóa
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/80">
            Hệ thống thống nhất phục vụ nghiên cứu, phân tích – thử nghiệm, nhân giống và chuyển giao khoa học công nghệ:
            dữ liệu dùng chung giữa các đơn vị, một lần đăng nhập.
          </p>

          <ul className="mt-8 grid max-w-xl gap-2.5">
            {SOFTWARE.map((m) => (
              <li key={m.code} className="flex items-center gap-3 rounded-xl bg-white/[0.08] px-3 py-2.5 ring-1 ring-white/15 backdrop-blur-sm">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${m.tone} shadow`}>
                  <m.icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 leading-tight">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <span className="rounded bg-white/15 px-1.5 py-px font-mono text-[10px]">{m.code}</span>
                    {m.name}
                  </span>
                  <span className="block truncate text-xs text-white/70">{m.desc}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="absolute bottom-6 left-0 right-0 z-10 text-center text-[11px] text-white/55">
          © {new Date().getFullYear()} Viện Nông nghiệp tỉnh Thanh Hóa · 271 Nguyễn Thục, phường Đông Quang, tỉnh Thanh Hoá · ĐT 02373.952.119
        </div>
      </div>
    </div>
  );
}
