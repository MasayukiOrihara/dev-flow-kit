"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = {
  href: string;
  label: string;
  enabled: boolean; // ← 未実装は false
};

const items: Item[] = [
  { href: "/tools/plan", label: "計画書生成", enabled: true },
  { href: "/tools/testCode", label: "テストコード生成", enabled: true },
  { href: "/tools/files", label: "ファイル管理", enabled: false },
];

export function ToolsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {items.map((it) => {
        const active = pathname === it.href;

        const base = "block w-full text-left rounded px-3 py-2 transition";
        const enabledCls = active ? "bg-muted font-medium" : "hover:bg-muted";
        const disabledCls =
          "text-muted-foreground opacity-60 cursor-not-allowed";

        if (!it.enabled) {
          // 未実装：クリック不可
          return (
            <button
              key={it.href}
              type="button"
              className={`${base} ${disabledCls}`}
              disabled
              title="準備中"
            >
              {it.label}
            </button>
          );
        }

        // 実装済：リンク
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
