"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { FileSelectButton } from "./fileSelectButton";
import { humanizeMime } from "@/lib/files/isProbably.file";
import { useWorkspaceFiles } from "../hooks/useWorkspaceFiles";

export default function FileUpdate() {
  const [uploading, setUploading] = useState(false);
  const { load, files, loading } = useWorkspaceFiles();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    load();
  }, []);

  /**
   * データアップロードAPI
   * @param e
   * @returns
   */
  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    setUploading(true);
    try {
      const fd = new FormData();
      for (const f of Array.from(e.target.files)) fd.append("files", f);

      const res = await fetch("/api/files", { method: "POST", body: fd });
      if (!res.ok) throw new Error("upload failed");

      await load();
      e.target.value = "";
    } finally {
      setUploading(false);
    }
  };

  /**
   * データ削除API
   * @param id
   * @returns
   */
  const onDelete = async (id: string) => {
    const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("delete failed");
      return;
    }
    await load();
  };

  /**
   * コピーハンドラ
   * @param text
   */
  const copyToClipboard = async (id: string, name: string) => {
    await navigator.clipboard.writeText(name);
    setCopiedId(id);

    // 連打対応：既存タイマーがあれば消して、時間をリセット
    if (timersRef.current[id]) clearTimeout(timersRef.current[id]);

    timersRef.current[id] = setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
      delete timersRef.current[id];
    }, 1200);
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
