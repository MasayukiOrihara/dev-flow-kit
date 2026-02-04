/**
 * サイドバーのitem要素
 */
export type SidebarItem = {
  href: string;
  label: string;
  enabled?: boolean; // ← 未実装は false, 省略時true扱い
  titleWhenDisabled?: string; // 例: "準備中"
};
