// import LocalDirectoryTreePicker from "@/components/file/browser/LocalDirectoryTreePicker";
import LocalDirectoryTreePickerClient from "@/components/client/LocalDirectoryTreePickerClient";
import LocalPicker from "@/components/file/browser/localFilePicker";
import ModeSwitchFab from "@/components/madeSwitchFab";

export default function BulkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-row">
      <LocalDirectoryTreePickerClient />

      <main className="flex-1 p-6 overflow-auto">{children}</main>
      <ModeSwitchFab />
    </div>
  );
}
