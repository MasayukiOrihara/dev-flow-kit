import { useCallback, useMemo, useState } from "react";

export type FileType =
  | "prismaSchema"
  | "controller"
  | "service"
  | "dbMap"
  | "openAPI";

export type FileNames = Record<FileType, string>;

const initialFileNames: FileNames = {
  prismaSchema: "",
  controller: "",
  service: "",
  dbMap: "",
  openAPI: "",
};

export function useFileNames(initial?: Partial<FileNames>) {
  const [files, setFiles] = useState<FileNames>({
    ...initialFileNames,
    ...initial,
  });

  const setFile = useCallback((type: FileType, name: string) => {
    setFiles((prev) => ({ ...prev, [type]: name }));
  }, []);

  const clearFile = useCallback((type: FileType) => {
    setFiles((prev) => ({ ...prev, [type]: "" }));
  }, []);

  const resetFiles = useCallback(() => {
    setFiles({ ...initialFileNames, ...(initial ?? {}) });
  }, [initial]);

  const isReady = useMemo(() => {
    return (Object.keys(initialFileNames) as FileType[]).every(
      (k) => files[k].trim().length > 0,
    );
  }, [files]);

  return {
    files,
    setFile,
    clearFile,
    resetFiles,
    isReady,
  };
}
