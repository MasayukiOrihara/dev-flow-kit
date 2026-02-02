/**
 * ファイルのインポート処理
 * @param fileHandle
 * @param relativePath
 */
async function importFileToWorkspace(
  fileHandle: FileSystemFileHandle,
  relativePath: string,
) {
  const file = await fileHandle.getFile();

  const fd = new FormData();
  fd.append("file", file);
  fd.append("relativePath", relativePath);

  const res = await fetch("/api/workspace/inputs/import", {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    throw new Error("import failed");
  }
}
