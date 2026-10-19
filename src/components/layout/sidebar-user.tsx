"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2, User as UserIcon } from "lucide-react";
import { authClient } from "@/lib/auth/client";

export function SidebarUser() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const email = session?.user.email ?? null;
  const name = session?.user.name || null;
  const [pending, startTransition] = useTransition();
  const [signingOut, setSigningOut] = useState(false);

  async function onLogout() {
    setSigningOut(true);
    await authClient.signOut();
    setSigningOut(false);
    startTransition(() => {
      router.replace("/login");
      router.refresh();
    });
  }

  const initial = (name ?? email ?? "?").charAt(0).toUpperCase();
  const loading = signingOut || pending;

  return (
    <div className="p-3 border-t border-sidebar-border space-y-2">
      <div className="flex items-center gap-3 px-2 py-2 rounded-md bg-sidebar-accent/40">
        <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center text-white text-xs font-semibold shrink-0">
          {email ? initial : <UserIcon className="w-4 h-4" />}
        </div>
        <div className="leading-tight text-xs min-w-0 flex-1">
          <div className="text-white font-medium truncate">
            {name ?? email ?? "Đang tải..."}
          </div>
          <div className="text-sidebar-foreground/60 truncate">
            {name && email ? email : "PTN VNNTH"}
          </div>
        </div>
      </div>
      <button
        onClick={onLogout}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 h-9 rounded-md text-xs font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-white transition-colors disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <LogOut className="w-3.5 h-3.5" />
        )}
        Đăng xuất
      </button>
    </div>
  );
}
