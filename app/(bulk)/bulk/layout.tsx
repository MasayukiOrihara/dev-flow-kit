import BulkWorkspaceImportClient from "@/components/client/bulkWorkspaceImportClient";
import ModeSwitchFab from "@/components/madeSwitchFab";
import { BulkSidebar } from "@/components/parts/bulkSidebar";

export default function BulkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-row">
      {/* フォルダ読み込み + ローカルフォルダ参照 */}
      <BulkWorkspaceImportClient />

      <aside className="w-48 border-r p-3 overflow-auto">
        <BulkSidebar />
      </aside>

      <main className="flex-1 p-6 overflow-auto">{children}</main>
      <ModeSwitchFab />
    </div>
  );
}
