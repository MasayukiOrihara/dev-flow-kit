"use client";

import { SidebarItem } from "@/contents/types/parts.type";
import { CommonSidebar } from "../common/commonSidebar";

const items: SidebarItem[] = [
  { href: "/tools/plan", label: "計画書", enabled: false },
  { href: "/tools/classDesign", label: "クラス仕様書", enabled: true },
  {
    href: "/tools/unitTestDesign",
    label: "単体テスト仕様書",
    enabled: true,
  },
  { href: "/tools/testCode", label: "単体テストコード", enabled: true },
  {
    href: "/tools/apiDBMap",
    label: "DBマッピング仕様",
    enabled: true,
  },
  {
    href: "/tools/apiTestCode",
    label: "APIテストコード",
    enabled: true,
  },
  { href: "/tools/systemTestDesign", label: "総合テスト仕様書", enabled: true },
];

export function ToolsSidebar() {
  return <CommonSidebar items={items} />;
}
