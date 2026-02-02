"use client";

import React, { useMemo, useRef, useState } from "react";
import { DND_NODE_ID } from "./dndKeys";
import { DirNode, TreeNode } from "@/contents/types/browser.type";
import { joinPath } from "@/lib/browser/joinPath.browser";
import { sortDirChildren } from "@/lib/browser/sortDirChildren.browser";
import { upsertChildDir } from "@/lib/browser/upsertChildDir.browser";
import { cloneTree } from "@/lib/browser/cloneTree.browser";
import { findDirById } from "@/lib/browser/findDirById.browser";
import { Button } from "@/components/ui/button";

/**
 * ディレクトリ構成のファイルを移動するコンポーネント
 * @param param0
 * @returns
 */
export default function LocalDirectoryTreePicker({
  title = "ローカルフォルダ",
  onPickedRoot,
}: {
  title?: string;
  onPickedRoot?: (root: DirNode) => void;
}) {
  const [root, setRoot] = useState<DirNode | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // 対策4：読み込み中UI
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [scannedDirs, setScannedDirs] = useState(0);
  const [scannedFiles, setScannedFiles] = useState(0);

  // 対策4：キャンセル
  const cancelRef = useRef(false);

  // 対策1：除外フォルダ（UIで編集可）
  const [ignoreText, setIgnoreText] = useState(
    [
      "node_modules",
      ".git",
      ".next",
      "dist",
      "build",
      "coverage",
      ".turbo",
    ].join(","),
  );
  const ignoreSet = useMemo(() => {
    return new Set(
      ignoreText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    );
  }, [ignoreText]);

  const canPick =
    typeof window !== "undefined" &&
    typeof (window as any).showDirectoryPicker === "function";

  const toggle = async (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

    // ディレクトリの遅延ロード：展開時に未ロードなら読み込む
    if (!root) return;
    const nextRoot = cloneTree(root);
    const dir = findDirById(nextRoot, id);
    if (!dir || dir.kind !== "directory") return;

    // 今回は「開いた瞬間」読みたいので、expanded状態は非同期だから
    // ここでは「未ロードなら読み込む」でOK（閉じたときも呼ばれるが loaded でガード）
    if (!dir.loaded) {
      await loadDirectoryChildren(dir, ignoreSet, {
        onProgress: (msg) => setStatus(msg),
        onCount: (d, f) => {
          setScannedDirs((x) => x + d);
          setScannedFiles((x) => x + f);
        },
        isCancelled: () => cancelRef.current,
      });
      sortDirChildren(dir);
      dir.loaded = true;
      setRoot(nextRoot);
    }
  };

  // 対策2/3：初回スキャンは「構造だけ + 段階更新」
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

      // ルートノード（まだ子は未ロード）
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
      onPickedRoot?.(rootNode);

      setStatus("ルート直下を読み込み中…");

      // ルート直下のみ先にロード（すぐ見える）
      await loadDirectoryChildren(rootNode, ignoreSet, {
        onProgress: (msg) => setStatus(msg),
        onCount: (d, f) => {
          setScannedDirs((x) => x + d);
          setScannedFiles((x) => x + f);
        },
        isCancelled: () => cancelRef.current,
      });
      sortDirChildren(rootNode);
      rootNode.loaded = true;

      // 対策3：段階更新（rootNode をそのまま set するだけでもOKだが、cloneで反映確実に）
      setRoot(cloneTree(rootNode));
      setStatus("完了");
    } catch (err: any) {
      // 対策4：キャンセルは黙って戻る
      if (err?.name === "AbortError") return;
      console.error(err);
      alert("フォルダの読み込みに失敗しました");
    } finally {
      setIsScanning(false);
    }
  };

  const collapseAll = () => setExpanded(new Set());

  const statsText = root
    ? `dirs: ${scannedDirs} / files: ${scannedFiles}`
    : "未選択";

  return (
    <div className="border-r p-2 w-64 h-screen flex flex-col overflow-hidden">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h2 className="font-semibold text-xs">{title}</h2>

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
            onClick={pickDir}
            className="px-2 text-sm disabled:opacity-40"
            disabled={!canPick || isScanning}
          >
            📂
          </Button>

          <Button
            variant={"outline"}
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

/** ===== Directory loader (対策1/2/3/4の中核) ===== */
async function loadDirectoryChildren(
  dir: DirNode,
  ignoreSet: Set<string>,
  opts: {
    onProgress?: (msg: string) => void;
    onCount?: (dirDelta: number, fileDelta: number) => void;
    isCancelled?: () => boolean;
  },
) {
  const { onProgress, onCount, isCancelled } = opts;

  let localDirs = 0;
  let localFiles = 0;

  // 既に children があるなら重複回避（追加読み込みしない）
  if (dir.loaded) return;

  onProgress?.(`読み込み中: ${dir.path || dir.name}`);

  // ★ 段階更新用：一定数ごとに yield
  let tick = 0;
  const YIELD_EVERY = 200;

  for await (const [name, handle] of dir.handle.entries()) {
    if (isCancelled?.()) return;

    if (handle.kind === "directory") {
      // 対策1：除外
      if (ignoreSet.has(name)) continue;

      upsertChildDir(
        dir,
        name,
        joinPath(dir.path, name),
        handle as FileSystemDirectoryHandle,
      );
      localDirs += 1;
    } else {
      // 対策2：File は読まない（handleだけ保持）
      dir.children.push({
        id: crypto.randomUUID(),
        kind: "file",
        name,
        path: joinPath(dir.path, name),
        handle: handle as FileSystemFileHandle,
      });
      localFiles += 1;
    }

    tick += 1;
    if (tick % YIELD_EVERY === 0) {
      // 対策3：UIを固めない（イベントループに返す）
      onCount?.(localDirs, localFiles);
      localDirs = 0;
      localFiles = 0;
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  onCount?.(localDirs, localFiles);
}

/** ===== Tree UI ===== */
function TreeRow({
  node,
  level,
  expanded,
  onToggle,
}: {
  node: TreeNode;
  level: number;
  expanded: Set<string>;
  onToggle: (id: string) => void | Promise<void>;
}) {
  const isDir = node.kind === "directory";
  const isOpen = isDir && expanded.has(node.id);
  const paddingLabel = 6;

  return (
    <div
      className="select-none"
      style={{ paddingLeft: `${level * paddingLabel}px` }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(DND_NODE_ID, node.id);
        e.dataTransfer.effectAllowed = "copy";
      }}
    >
      <div className="flex items-center gap-1 hover:bg-muted/40 rounded py-0.2">
        {isDir ? (
          <button
            type="button"
            onClick={() => void onToggle(node.id)}
            className="w-4 h-6 grid place-items-center rounded hover:bg-muted"
            aria-label={isOpen ? "collapse" : "expand"}
            title={node.loaded ? "" : "未読み込み（開くと読み込み）"}
          >
            {isOpen ? "▾" : "▸"}
          </button>
        ) : (
          <span className="w-4 text-center opacity-40">•</span>
        )}

        <span className="font-mono text-sm opacity-70">
          {isDir ? "📁" : "📄"}
        </span>

        <span className="text-sm">{node.name}</span>

        <span className="ml-auto text-xs opacity-60 flex items-center gap-1 font-mono">
          {node.kind === "file" && <span title="File">F</span>}

          {node.kind === "directory" &&
            (node.loaded ? (
              <span title="Loaded">L</span>
            ) : (
              <span title="Not loaded">…</span>
            ))}
        </span>
      </div>

      {isDir && isOpen && (
        <div>
          {node.children.length === 0 && !node.loaded ? (
            <div
              className="text-xs opacity-60 px-2 py-2"
              style={{ paddingLeft: `${(level + 1) * paddingLabel}px` }}
            >
              （未読み込み）
            </div>
          ) : node.children.length === 0 ? (
            <div
              className="text-xs opacity-60 px-2 py-2"
              style={{ paddingLeft: `${(level + 1) * paddingLabel}px` }}
            >
              （空）
            </div>
          ) : (
            node.children.map((c) => (
              <TreeRow
                key={c.id}
                node={c}
                level={level + 1}
                expanded={expanded}
                onToggle={onToggle}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// LocalDirectoryTreePicker.tsx の loadDirectoryChildren を export にする
export async function loadDirectoryChildrenForDnD(
  dir: DirNode,
  ignoreSet: Set<string>,
) {
  // 既存の loadDirectoryChildren を呼ぶだけ
  await loadDirectoryChildren(dir, ignoreSet, {});
  // ※ optsは不要でOK（進捗はDropZone側で出す）
}
