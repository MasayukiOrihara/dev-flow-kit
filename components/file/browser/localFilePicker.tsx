"use client";
import { useState } from "react";

type LocalItem = {
  id: string;
  name: string;
  file: File; // 実体
  relativePath?: string;
};

export default function LocalPicker() {
  const [items, setItems] = useState<LocalItem[]>([]);

  const pickDir = async () => {
    if (!window.showDirectoryPicker) {
      alert("このブラウザはフォルダ選択に対応していません（Chrome推奨）");
      return;
    }

    const dirHandle: FileSystemDirectoryHandle =
      await window.showDirectoryPicker();

    const collected: LocalItem[] = [];

    for await (const [name, handle] of dirHandle.entries()) {
      if (handle.kind === "file") {
        const file = await (handle as FileSystemFileHandle).getFile();
        collected.push({
          id: crypto.randomUUID(),
          name,
          file,
        });
      }
    }

    setItems(collected);
  };

  return (
    <div className="border">
      <button onClick={pickDir}>フォルダを選択</button>

      <ul>
        {items.map((it) => (
          <li
            key={it.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", it.id);
            }}
          >
            {it.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
