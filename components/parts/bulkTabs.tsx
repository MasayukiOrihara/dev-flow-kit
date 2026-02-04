"use client";

import { SidebarItem } from "@/contents/types/parts.type";
import { CommonTabs } from "../common/commonTabs";

const items: SidebarItem[] = [
  { href: "/bulk/plan", label: "計画書", enabled: false },
  { href: "/bulk/unitTestCode", label: "単体テストコード", enabled: true },
  { href: "/bulk/apiTestCode", label: "APIテストコード", enabled: true },
];

export function BulkTabs() {
  return <CommonTabs items={items} />;
}
