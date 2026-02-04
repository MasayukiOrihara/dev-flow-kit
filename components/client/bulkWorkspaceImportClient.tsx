"use client";

import { useState } from "react";
import WorkspaceDropZone from "@/components/file/browser/workspaceDropZone";
import LocalDirectoryTreePicker, {
  loadDirectoryChildrenForDnD,
} from "../file/browser/localDirectoryTreePicker";
import { DirNode } from "@/contents/types/browser.type";
import { useIgnoreSet } from "../hooks/browser/useIgnoreSet";

export default function BulkWorkspaceImportClient() {
  const [root, setRoot] = useState<DirNode | null>(null);
  const { ignoreSet } = useIgnoreSet();

  return (
    <div className="flex">
      <LocalDirectoryTreePicker onPickedRoot={setRoot} />
      <WorkspaceDropZone
        root={root}
        loadDirChildren={(dir) => loadDirectoryChildrenForDnD(dir, ignoreSet)}
      />
    </div>
  );
}
