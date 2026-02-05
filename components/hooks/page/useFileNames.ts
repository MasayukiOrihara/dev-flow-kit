import { useCallback, useMemo, useState } from "react";

type FileMap<K extends string> = Record<K, string>;

export function useFileNames<K extends string>(
  initial: Partial<FileMap<K>> = {},
) {
  const initialFileNames = useMemo(
    () =>
      Object.fromEntries(
        Object.keys(initial).map((k) => [k, ""]),
      ) as FileMap<K>,
    [],
  );

  const [files, setFiles] = useState<FileMap<K>>({
    ...initialFileNames,
    ...initial,
  });

  const setFile = useCallback((type: K, name: string) => {
    setFiles((prev) => ({ ...prev, [type]: name }));
  }, []);

  const clearFile = useCallback((type: K) => {
    setFiles((prev) => ({ ...prev, [type]: "" }));
  }, []);

  const resetFiles = useCallback(() => {
    setFiles({ ...initialFileNames, ...initial });
  }, [initial, initialFileNames]);

  const isReady = useMemo(() => {
    return (Object.keys(files) as K[]).every((k) => files[k].trim().length > 0);
  }, [files]);

  return {
    files,
    setFile,
    clearFile,
    resetFiles,
    isReady,
  };
}
