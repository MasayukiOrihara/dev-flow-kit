"use client";

import { SidebarItem } from "@/contents/types/parts.type";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function CommonTabs({
  items,
  className,
  activeMatch = "exact",
}: {
  items: SidebarItem[];
  className?: string;
  activeMatch?: "exact" | "prefix";
}) {
  const pathname = usePathname();

  return (
    <nav
      className={
        className ??
        "flex items-center gap-1 border-b border-border overflow-x-auto"
      }
      aria-label="Tabs"
    >
      {items.map((it) => {
        const enabled = it.enabled ?? true;

        const active =
          activeMatch === "exact"
            ? pathname === it.href
            : pathname === it.href || pathname.startsWith(it.href + "/");

        const base =
          "inline-flex shrink-0 items-center justify-center px-3 py-3 text-sm transition whitespace-nowrap border-b-2";
        const activeCls = "border-primary text-foreground font-medium";
        const inactiveCls =
          "border-transparent text-muted-foreground hover:text-foreground hover:border-muted";
        const disabledCls =
          "border-transparent text-muted-foreground opacity-60 cursor-not-allowed";

        if (!enabled) {
          return (
            <button
              key={it.href}
              type="button"
              className={`${base} ${disabledCls}`}
              disabled
              title={it.titleWhenDisabled ?? "準備中"}
              aria-disabled="true"
            >
              {it.label}
            </button>
          );
        }

        return (
          <Link
            key={it.href}
            href={it.href}
            className={`${base} ${active ? activeCls : inactiveCls}`}
            aria-current={active ? "page" : undefined}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
