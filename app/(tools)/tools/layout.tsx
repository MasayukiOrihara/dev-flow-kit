import ModeSwitchFab from "@/components/madeSwitchFab";
import { ToolsSidebar } from "@/components/parts/toolsSidebar";
import TopFileBar from "@/components/parts/topFileBar";

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col">
      {/* 上：共通ファイル選択UI */}
      <div className="border-b p-4">
        <TopFileBar />
      </div>

      {/* 下：メイン機能（左サイドバー＋右コンテンツ） */}
      <div className="flex flex-1 min-h-0">
        <aside className="w-48 border-r p-3 overflow-auto">
          <ToolsSidebar />
        </aside>

        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>

      <ModeSwitchFab />
    </div>
  );
}
