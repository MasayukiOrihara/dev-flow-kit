import BulkWorkspaceImportClient from "@/components/client/bulkWorkspaceImportClient";
import ModeSwitchFab from "@/components/madeSwitchFab";
import { BulkSidebar } from "@/components/parts/bulkSidebar";
import { BulkTabs } from "@/components/parts/bulkTabs";

export default function BulkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-row">
      {/* フォルダ読み込み + ローカルフォルダ参照 */}
      <BulkWorkspaceImportClient />

      <div className="flex flex-col w-full overflow-hidden">
        <BulkTabs />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>

      <ModeSwitchFab />
    </div>
  );
}
