"use client";

import { useEffect, useState } from "react";

type FileMeta = {
  id: string;
  name: string;
  size: number;
  mime: string;
  uploadedAt: string;
};

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
    <main style={{ padding: 16 }}>
      <h1>Dev Flow Kit - Files</h1>

      <input type="file" multiple onChange={onUpload} />
      {uploading ? <p>Uploading...</p> : null}

      <h2>Uploaded</h2>
      <ul>
        {files.map((f) => (
          <li key={f.id}>
            <a href={`/api/files/${f.id}`} target="_blank" rel="noreferrer">
              {f.name}
            </a>{" "}
            <small>
              ({Math.round(f.size / 1024)}KB / {f.mime} /{" "}
              {new Date(f.uploadedAt).toLocaleString()})
            </small>
            <button onClick={() => onDelete(f.id)} style={{ marginLeft: 8 }}>
              削除
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
