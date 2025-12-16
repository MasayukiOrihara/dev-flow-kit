"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { FileSelectButton } from "./fileSelectButton";

type FileMeta = {
  id: string;
  name: string;
  size: number;
  mime: string;
  uploadedAt: string;
};

function humanizeMime(mime: string) {
  if (mime.includes("spreadsheet")) return "Excel (.xlsx)";
  if (mime.includes("wordprocessing")) return "Word (.docx)";
  if (mime === "application/pdf") return "PDF";
  return mime;
}

export default function FileUpdate() {
  const [files, setFiles] = useState<FileMeta[]>([]);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const res = await fetch("/api/files");
    const json = await res.json();
    setFiles(json.files ?? []);
  };

  useEffect(() => {
    load();
  }, []);

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

  const onDelete = async (id: string) => {
    const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("delete failed");
      return;
    }
    await load();
  };

  return (
    <main className="px-8 py-4">
      <h1>Dev Flow Kit - ファイル選択</h1>

      <div className="m-3 text-xs text-zinc-500">
        <FileSelectButton onUpload={onUpload} />
        {uploading ? <p className="ml-3">アップロード中...</p> : null}
      </div>

      <h2>アップロード済みファイル</h2>
      <ul className="text-sm">
        {files.map((f) => (
          <li key={f.id}>
            <a href={`/api/files/${f.id}`} target="_blank" rel="noreferrer">
              {f.name}
            </a>{" "}
            <small>
              ({Math.round(f.size / 1024)}KB / {humanizeMime(f.mime)} /{" "}
              {new Date(f.uploadedAt).toLocaleString()})
            </small>
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
    </main>
  );
}
