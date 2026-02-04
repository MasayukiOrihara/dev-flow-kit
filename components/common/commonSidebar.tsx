"use client";

import { SidebarItem } from "@/contents/types/parts.type";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function CommonSidebar({
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
    <nav className={className ?? "space-y-1"}>
      {items.map((it) => {
        const enabled = it.enabled ?? true;

        const active =
          activeMatch === "exact"
            ? pathname === it.href
            : pathname === it.href || pathname.startsWith(it.href + "/");

        const base = "block w-full text-left rounded px-3 py-2 transition";
        const enabledCls = active ? "bg-muted font-medium" : "hover:bg-muted";
        const disabledCls =
          "text-muted-foreground opacity-60 cursor-not-allowed";

        if (!enabled) {
          return (
            <button
              key={it.href}
              type="button"
              className={`${base} ${disabledCls}`}
              disabled
              title={it.titleWhenDisabled ?? "準備中"}
            >
              {it.label}
            </button>
          );
        }

        return (
          <Link
            key={it.href}
            href={it.href}
            className={`${base} ${enabledCls}`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
