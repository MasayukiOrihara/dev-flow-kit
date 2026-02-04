"use client";

import React, { useEffect, useState } from "react";
import { DirNode, TreeNode } from "@/contents/types/browser.type";
import { humanizeMime } from "@/lib/files/isProbably.file";
import { Button } from "@/components/ui/button";
import { useWorkspaceFiles } from "@/components/hooks/useWorkspaceFiles";
import { useClipboardCopy } from "@/components/hooks/useClipboardCopy";
import { DND_NODE_ID } from "@/contents/parametars/file.parametar";

// LocalDirectoryTreePicker の型を import できる前提（同ファイルにexportしてる想定）

type Props = {
  root: DirNode | null;
  /** 未ロードのディレクトリをロードする関数（LocalPicker側の loader を流用したい） */
  loadDirChildren: (dir: DirNode) => Promise<void>;
};

function findNodeById(root: DirNode, id: string): TreeNode | null {
  if (root.id === id) return root;
  for (const c of root.children) {
    if (c.id === id) return c;
    if (c.kind === "directory") {
      const found = findNodeById(c, id);
      if (found) return found;
    }
  }
  return null;
}

export default function WorkspaceDropZone({ root, loadDirChildren }: Props) {
  const [isOver, setIsOver] = useState(false);
  const [status, setStatus] = useState<string>("");

  const { load, upload, remove, files } = useWorkspaceFiles();
  const { copiedId, copyToClipboard } = useClipboardCopy(1200);

  // 全ファイルのロード
  useEffect(() => {
    load();
  }, []);

  const canDrop = !!root;

  /**
   * 共通：File[] を /api/files に投げる（input方式と同じ）
   * @param files
   * @returns
   */
  const uploadFiles = async (files: File[]) => {
    if (!files.length) return;
    setStatus(`アップロード準備中… (${files.length}件)`);

    try {
      setStatus(`アップロード中… 0/${files.length}`);
      await upload(files);
    } catch {
      alert("upload failed");
    }

    setStatus("反映中…");
    await load();
    setStatus("アップロード完了");
  };

  /**
   * ディレクトリ配下の FileNode を全部集める（階層保持はしない）
   * @param dir
   * @param out
   */
  const collectFileNodes = async (dir: any, out: any[]) => {
    // 未ロードならロード
    if (!dir.loaded) {
      await loadDirChildren(dir);
      dir.loaded = true;
    }
    for (const c of dir.children) {
      if (c.kind === "file") out.push(c);
      else await collectFileNodes(c, out);
    }
  };

  /**
   * ドロップ時の処理
   * @param e
   * @returns
   */
  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);

    if (!root) return;
    const nodeId = e.dataTransfer.getData(DND_NODE_ID);
    if (!nodeId) return;

    const node = findNodeById(root, nodeId);
    if (!node) return;

    // root ガード
    if (node.id === root.id) {
      setStatus("ルートは取り込めません（DnDの対象IDが不正です）");
      return;
    }

    try {
      setStatus("準備中…");

      const files: File[] = [];

      if (node.kind === "file") {
        // FileSystemFileHandle -> File
        setStatus(`ファイル取得中: ${node.path}`);
        const file = await node.handle.getFile();
        files.push(file);
      } else {
        // フォルダ：配下の file をぜんぶ取得（階層無視）
        const fileNodes: any[] = [];
        await collectFileNodes(node, fileNodes);

        setStatus(`ファイル取得中… 0/${fileNodes.length}`);

        let done = 0;
        for (const fn of fileNodes) {
          files.push(await fn.handle.getFile());
          done += 1;
          if (done % 20 === 0 || done === fileNodes.length) {
            setStatus(`ファイル取得中… ${done}/${fileNodes.length}`);
          }
        }
      }

      // input方式と同じアップロード
      await uploadFiles(files);
    } catch (err) {
      if (err instanceof Error) {
        console.error(err.message);
        setStatus(`アップロード失敗: ${err.message}`);
      }
      console.error(err);
      setStatus(`アップロード失敗: ${String(err)}`);
    }
  };

  /**
   * データ削除API
   * @param id
   * @returns
   */
  const onDelete = async (id: string) => {
    try {
      await remove(id);
    } catch {
      alert("delete failed");
    }
    await load();
  };

  return (
    <div
      className={[
        "w-64 border-r p-4 transition h-screen overflow-hidden flex flex-col",
        isOver ? "border-black bg-muted/30" : "border-dashed",
        !canDrop ? "opacity-50" : "",
      ].join(" ")}
      onDragEnter={(e) => {
        if (!canDrop) return;
        e.preventDefault();
        setIsOver(true);
      }}
      onDragOver={(e) => {
        if (!canDrop) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={onDrop}
    >
      <div className="font-semibold">workspace/inputs にアップロード</div>
      <div className="text-sm opacity-70 mt-1">
        左のファイル or
        フォルダをここにドロップすると、階層は無視してアップロードします。
      </div>

      {status ? <div className="text-xs opacity-70 mt-3">{status}</div> : null}

      <h2>アップロード済みファイル</h2>
      <div className="flex-1 overflow-y-auto scrollbar-hidden">
        <ul className="text-sm">
          {files.map((f) => (
            <li key={f.id}>
              <a href={`/api/files/${f.id}`} target="_blank" rel="noreferrer">
                {f.name}
              </a>{" "}
              <small>
                ({Math.round(f.size / 1024)}KB / {humanizeMime(f.mime, f.name)}{" "}
                / {new Date(f.uploadedAt).toLocaleString()})
              </small>
              <Button
                variant="outline"
                size="xs"
                onClick={() => copyToClipboard(f.id, f.name)}
                className="shrink-0 ml-2"
              >
                {copiedId === f.id ? "済" : "コピー"}
              </Button>
              <Button
                variant="default"
                size="xs"
                onClick={() => onDelete(f.id)}
                className="hover:bg-red-500 ml-2"
              >
                削除
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
