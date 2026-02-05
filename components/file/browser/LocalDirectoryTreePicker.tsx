// components/local/LocalDirectoryTreePicker.tsx
"use client";

import React, { useState } from "react";
import { DirNode } from "@/contents/types/browser.type";
import { Button } from "@/components/ui/button";
import { useIgnoreSet } from "@/components/hooks/browser/useIgnoreSet";
import { useLocalDirTree } from "@/components/hooks/browser/useLocalDirTree";
import { TreeRow } from "./TreeRow";

export default function LocalDirectoryTreePicker({
  title = "ローカルフォルダ",
  onPickedRoot,
  loadDirChildren,
}: {
  title?: string;
  onPickedRoot?: (root: DirNode) => void;
  loadDirChildren: (dir: DirNode) => Promise<void>;
}) {
  // 除外フォルダ（UIで編集可）
  const { ignoreText, setIgnoreText, ignoreSet } = useIgnoreSet();

  const {
    root,
    expanded,
    canPick,
    isScanning,
    status,
    statsText,
    toggle,
    pickDir,
    collapseAll,
  } = useLocalDirTree({ onPickedRoot, ignoreSet, loadDirChildren });

  return (
    <div className="border-r p-2 w-64 h-screen flex flex-col overflow-hidden">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h2 className="font-semibold text-sm">{title}</h2>

          <div className="mt-1 text-xs opacity-70 flex gap-2 flex-wrap items-center">
            <span>{statsText}</span>
            {status ? <span>• {status}</span> : null}
            {isScanning ? (
              <span className="text-amber-600">• 読み込み中</span>
            ) : null}
          </div>

          <div className="mt-2">
            <label className="text-xs opacity-70">
              除外フォルダ（カンマ区切り）
            </label>
            <input
              value={ignoreText}
              onChange={(e) => setIgnoreText(e.target.value)}
              className="mt-1 w-full border rounded px-1 py-0.8 text-sm"
              placeholder="node_modules,.git,.next,dist,build"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => void pickDir()}
            className="px-2 text-sm disabled:opacity-40"
            disabled={!canPick || isScanning}
          >
            📂
          </Button>

          <Button
            variant="outline"
            onClick={collapseAll}
            className="px-3 text-sm disabled:opacity-40"
            disabled={!root}
          >
            ⇪
          </Button>
        </div>
      </div>

      <div className="mt-2 overflow-y-auto scrollbar-hidden">
        {!root ? (
          <div className="text-sm opacity-60 p-4">
            フォルダを選択すると階層が表示されます。
          </div>
        ) : (
          <TreeRow
            node={root}
            level={0}
            expanded={expanded}
            onToggle={toggle}
          />
        )}
      </div>

      {!canPick && (
        <div className="mt-2 text-xs text-amber-600">
          このブラウザは showDirectoryPicker に未対応です（Chrome系推奨）。
        </div>
      )}
    </div>
  );
}
