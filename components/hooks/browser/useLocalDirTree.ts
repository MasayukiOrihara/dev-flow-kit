// components/hooks/browser/useLocalDirTree.ts
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DirNode } from "@/contents/types/browser.type";
import { sortDirChildren } from "@/lib/browser/sortDirChildren.browser";
import {
  loadDirectoryChildren,
  LoadDirOpts,
} from "@/lib/browser/loadDirectoryChildren.browser";
import { cloneTree } from "@/lib/browser/tree.browser";

export function useLocalDirTree({
  onPickedRoot,
  ignoreSet,
  loadDirChildren,
}: {
  onPickedRoot?: (root: DirNode) => void;
  ignoreSet: Set<string>;
  loadDirChildren: (dir: DirNode) => Promise<void>;
}) {
  const [root, setRoot] = useState<DirNode | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [canPick, setCanPick] = useState(false);

  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState("");
  const [scannedDirs, setScannedDirs] = useState(0);
  const [scannedFiles, setScannedFiles] = useState(0);

  const cancelRef = useRef(false);

  // showDirectoryPicker 対応チェック
  useEffect(() => {
    setCanPick(
      typeof window !== "undefined" &&
        typeof (window as any).showDirectoryPicker === "function",
    );
  }, []);

  // 親へ最新root参照を通知（今回ハマった参照ズレを防止）
  useEffect(() => {
    if (root) onPickedRoot?.(root);
  }, [root, onPickedRoot]);

  const statsText = useMemo(() => {
    return root ? `dirs: ${scannedDirs} / files: ${scannedFiles}` : "未選択";
  }, [root, scannedDirs, scannedFiles]);

  const collapseAll = () => setExpanded(new Set());

  const toggle = async (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

    if (!root) return;

    // clone → 対象dir参照取得 → 必要ならロード → setRoot
    const nextRoot = cloneTree(root);

    // findDirById を使わず、id一致でDirNodeを探す（簡易に手書き）
    const findDir = (d: DirNode, targetId: string): DirNode | null => {
      if (d.id === targetId) return d;
      for (const c of d.children) {
        if (c.kind === "directory") {
          const found = findDir(c, targetId);
          if (found) return found;
        }
      }
      return null;
    };

    const dir = findDir(nextRoot, id);
    if (!dir) return;

    if (!dir.loaded) {
      await loadDirChildren(dir);
      setRoot(nextRoot);
    } else {
      // loadedなら開閉だけでOKだが、参照統一のために更新はしない
      // setRoot(nextRoot); // 必要なら入れてもOK
    }
  };

  const pickDir = async () => {
    try {
      const picker = (window as any).showDirectoryPicker as
        | undefined
        | (() => Promise<FileSystemDirectoryHandle>);
      if (!picker) {
        alert("このブラウザはフォルダ選択に対応していません（Chrome推奨）");
        return;
      }

      cancelRef.current = false;
      setIsScanning(true);
      setStatus("フォルダ選択中…");
      setScannedDirs(0);
      setScannedFiles(0);

      const dirHandle = await picker();

      const rootNode: DirNode = {
        id: crypto.randomUUID(),
        kind: "directory",
        name: dirHandle.name,
        path: "",
        handle: dirHandle,
        children: [],
        loaded: false,
      };

      setRoot(rootNode);
      setExpanded(new Set([rootNode.id]));
      setStatus("ルート直下を読み込み中…");

      await loadDirChildren(rootNode);

      // 反映確実化（clone）
      setRoot(cloneTree(rootNode));
      setStatus("完了");
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      console.error(err);
      alert("フォルダの読み込みに失敗しました");
    } finally {
      setIsScanning(false);
    }
  };

  return {
    root,
    expanded,
    canPick,
    isScanning,
    status,
    statsText,
    cancelRef,
    setExpanded,
    setRoot,
    toggle,
    pickDir,
    collapseAll,
    loadDirChildren, // DropZoneへ渡す用
    setStatus,
  };
}
