"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

/** Đăng xuất: xóa cả cookie "trình duyệt đã xác thực 2 lớp". */
export async function signOutAll() {
  await fetch("/api/mfa/logout", { method: "POST" }).catch(() => undefined);
  await authClient.signOut();
}

export function SignOutLink() {
  const router = useRouter();
  return (
    <button
      className="text-xs text-muted-foreground hover:text-foreground underline"
      onClick={async () => {
        await signOutAll();
        router.replace("/login");
        router.refresh();
      }}
    >
      Đăng nhập bằng tài khoản khác
    </button>
  );
}
