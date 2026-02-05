// workspaceDropZone.tsx
"use client";

import React, { useEffect } from "react";
import { DirNode } from "@/contents/types/browser.type";
import { humanizeMime } from "@/lib/files/isProbably.file";
import { Button } from "@/components/ui/button";
import { useWorkspaceFiles } from "@/components/hooks/browser/useWorkspaceFiles";
import { useClipboardCopy } from "@/components/hooks/browser/useClipboardCopy";
import { useWorkspaceDrop } from "@/components/hooks/browser/useWorkspaceDrop";

type Props = {
  root: DirNode | null;
  /** 未ロードのディレクトリをロードする関数（LocalPicker側の loader を流用） */
  loadDirChildren: (dir: DirNode) => Promise<void>;
};

export default function WorkspaceDropZone({ root, loadDirChildren }: Props) {
  const { load, upload, remove, files } = useWorkspaceFiles();
  const { copiedId, copyToClipboard } = useClipboardCopy(1200);

  // 初回ロード（アップロード済み一覧）
  useEffect(() => {
    void load();
  }, [load]);

  // input方式と同じアップロード処理（hookに渡す）
  const uploadFiles = async (filesToUpload: File[]) => {
    if (!filesToUpload.length) return;
    await upload(filesToUpload);
    await load();
  };

  const { status, isOver, setIsOver, onDrop } = useWorkspaceDrop({
    root,
    loadDirChildren,
    uploadFiles,
  });

  const canDrop = !!root;

  const onDelete = async (id: string) => {
    await remove(id);
    await load();
  };

  return (
    <div
      className={[
        "w-64 border-r p-2 transition h-screen overflow-hidden flex flex-col",
        isOver ? "border-black bg-muted/30" : "border-dashed",
        !canDrop ? "opacity-70" : "",
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
      <h1 className="text-sm font-semibold">ワークスペース</h1>
      <div className="flex items-center">
        <p className="text-xs opacity-70 mt-1">
          左のファイル or フォルダをここにドロップするとコピーされます
        </p>
        <Button variant="outline" size="sm" onClick={load} className="ml-2">
          {"更新"}
        </Button>
      </div>

      {status ? <div className="text-xs opacity-70 mt-3">{status}</div> : null}

      <h2 className="mt-4 text-sm">アップロード済みファイル</h2>

      <div className="flex-1 overflow-y-auto scrollbar-hidden">
        <ul className="text-xs">
          {files.map((f) => (
            <li key={f.id} className="py-1 flex justify-between">
              <div className="flex flex-col">
                <a href={`/api/files/${f.id}`} target="_blank" rel="noreferrer">
                  {f.name}
                </a>
                <small>
                  ({Math.round(f.size / 1024)}KB /{" "}
                  {humanizeMime(f.mime, f.name)} /{" "}
                  {new Date(f.uploadedAt).toLocaleString()})
                </small>
              </div>
              <div className="flex flex-col gap-1">
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
                  onClick={() => void onDelete(f.id)}
                  className="hover:bg-red-500 ml-2"
                >
                  削除
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
