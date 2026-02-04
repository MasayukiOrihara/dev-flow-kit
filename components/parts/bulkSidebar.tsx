"use client";

import { SidebarItem } from "@/contents/types/parts.type";
import { CommonSidebar } from "../common/commonSidebar";

const items: SidebarItem[] = [
  { href: "/bulk/plan", label: "計画書", enabled: false },
  { href: "/bulk/unitTestCode", label: "単体テストコード", enabled: true },
  { href: "/bulk/apiTestCode", label: "単体テスト仕様書", enabled: true },
];

export function BulkSidebar() {
  return <CommonSidebar items={items} />;
}
