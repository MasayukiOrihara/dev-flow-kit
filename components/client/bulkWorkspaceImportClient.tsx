"use client";

import { useMemo, useState } from "react";
import WorkspaceDropZone from "@/components/file/browser/workspaceDropZone";
import LocalDirectoryTreePicker, {
  loadDirectoryChildrenForDnD,
} from "../file/browser/localDirectoryTreePicker";
import { DirNode } from "@/contents/types/browser.type";

export default function BulkWorkspaceImportClient() {
  const [root, setRoot] = useState<DirNode | null>(null);

  const ignoreSet = useMemo(
    () =>
      new Set([
        "node_modules",
        ".git",
        ".next",
        "dist",
        "build",
        "coverage",
        ".turbo",
      ]),
    [],
  );

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
