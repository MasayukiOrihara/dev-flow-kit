// hooks/useWorkspaceFiles.ts
import { useCallback, useState } from "react";

export function useWorkspaceFiles() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // ロード処理
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/files");
      if (!res.ok) throw new Error("failed to fetch files");

      const json = await res.json();
      const files = json.files ?? [];
      setFiles(files);
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // アップロード処理
  const upload = useCallback(async (filesToUpload: File[]) => {
    if (!filesToUpload.length) return;

    setUploading(true);
    try {
      const fd = new FormData();
      for (const f of filesToUpload) fd.append("files", f);

      const res = await fetch("/api/files", { method: "POST", body: fd });
      if (!res.ok) throw new Error("upload failed");
    } catch (e: any) {
      setError(e);
    } finally {
      setUploading(false);
    }
  }, []);

  // 削除処理
  const remove = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    files,
    loading,
    uploading,
    error,
    load,
    remove,
    upload,
    setFiles, // 必要なら外から直接更新できる
  };
}
