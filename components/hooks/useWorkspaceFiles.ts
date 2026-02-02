// hooks/useWorkspaceFiles.ts
import { useCallback, useState } from "react";

export function useWorkspaceFiles() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

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

  return {
    files,
    loading,
    error,
    load,
    setFiles, // 必要なら外から直接更新できる
  };
}
