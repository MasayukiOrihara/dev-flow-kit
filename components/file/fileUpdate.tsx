"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { FileSelectButton } from "./fileSelectButton";
import { humanizeMime } from "@/lib/files/isProbably.file";
import { useWorkspaceFiles } from "../hooks/useWorkspaceFiles";
import { useClipboardCopy } from "../hooks/useClipboardCopy";

export default function FileUpdate() {
  const { load, upload, remove, files, uploading } = useWorkspaceFiles();
  const { copiedId, copyToClipboard } = useClipboardCopy(1200);

  useEffect(() => {
    load();
  }, []);

  /**
   * データアップロードAPI
   * @param e
   * @returns
   */
  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    try {
      await upload(files);
      e.target.value = "";
    } catch {
      alert("upload failed");
    }
    await load();
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
    <main className="px-8 py-4">
      <div className="flex items-center">
        <h1>Dev Flow Kit - ファイル選択</h1>
        <Button variant="outline" size="sm" onClick={load} className="ml-2">
          {"更新"}
        </Button>
      </div>

      <div className="m-3 text-xs text-zinc-500">
        <FileSelectButton onUpload={onUpload} />
        {uploading ? <p className="ml-3">アップロード中...</p> : null}
      </div>

      <h2>アップロード済みファイル</h2>
      <div className="max-h-18 overflow-y-auto">
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
    </main>
  );
}
