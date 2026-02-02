"use client";
import { useMemo } from "react";

export function WorkspaceDropZone({
  localItems,
  onImported,
}: {
  localItems: { id: string; file: File; name: string }[];
  onImported: () => void;
}) {
  const itemMap = useMemo(
    () => new Map(localItems.map((i) => [i.id, i])),
    [localItems],
  );

  const importFile = async (file: File, name: string) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("destName", name);

    const res = await fetch("/api/workspace/inputs/import", {
      method: "POST",
      body: fd,
    });
    if (!res.ok) throw new Error("import failed");
  };

  return (
    <div
      className="border rounded p-4 min-h-40"
      onDragOver={(e) => e.preventDefault()}
      onDrop={async (e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData("text/plain");
        const item = itemMap.get(id);
        if (!item) return;

        await importFile(item.file, item.name);
        onImported(); // workspace一覧リロード
      }}
    >
      ここにドロップして取り込み
    </div>
  );
}
