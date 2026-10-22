"use client";

import { Bell, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { moduleOf } from "@/components/layout/nav-config";

type HeaderProps = {
  title: string;
  description?: string;
};

export function Header({ title, description }: HeaderProps) {
  const searchHint = moduleOf(usePathname())?.searchHint ?? "Tìm kiếm...";
  return (
    <header className="h-14 sm:h-16 shrink-0 border-b border-border bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/60 px-3 sm:px-6 flex items-center gap-3 sm:gap-4">
      <div className="min-w-0 flex-1">
        <h1 className="truncate border-l-4 border-primary pl-2.5 text-sm font-semibold sm:text-lg">{title}</h1>
        {description && (
          <p className="hidden sm:block truncate pl-3.5 text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden lg:flex items-center gap-2 rounded-md border border-input bg-background px-2.5 h-9 w-72 text-sm text-muted-foreground">
          <Search className="w-4 h-4" />
          <input
            className="bg-transparent outline-none flex-1 placeholder:text-muted-foreground"
            placeholder={searchHint}
          />
          <kbd className="text-[10px] border rounded px-1 py-0.5 text-muted-foreground/70">
            Ctrl K
          </kbd>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Tìm kiếm"
          className="lg:hidden"
        >
          <Search />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Thông báo">
          <Bell />
        </Button>
      </div>
    </header>
  );
}
