import { ToolsSidebar } from "@/components/parts/toolsSidebar";
import TopFileBar from "@/components/parts/topFileBar";

export default function BulkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col">
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
