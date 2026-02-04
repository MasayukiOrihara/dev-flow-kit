"use client";

import { useMemo, useState } from "react";
import { DirNode } from "@/contents/types/browser.type";
import { useIgnoreSet } from "../hooks/browser/useIgnoreSet";

import { sortDirChildren } from "@/lib/browser/sortDirChildren.browser";
import { loadDirectoryChildren } from "@/lib/browser/loadDirectoryChildren.browser";
import LocalDirectoryTreePicker from "../file/browser/localDirectoryTreePicker";
import WorkspaceDropZone from "../file/browser/workspaceDropZone";

export default function BulkWorkspaceImportClient() {
  const [root, setRoot] = useState<DirNode | null>(null);
  const { ignoreSet } = useIgnoreSet();

  // ignoreSet を閉じ込めた “安定した loader” を親で作る
  const loadDirChildren = useMemo(() => {
    return async (dir: DirNode) => {
      await loadDirectoryChildren(dir, ignoreSet, {});
      sortDirChildren(dir);
      dir.loaded = true;
    };
  }, [ignoreSet]);

  return (
    <div className="flex">
      <LocalDirectoryTreePicker
        onPickedRoot={setRoot}
        loadDirChildren={loadDirChildren}
      />
      <WorkspaceDropZone root={root} loadDirChildren={loadDirChildren} />
    </div>
  );
}
