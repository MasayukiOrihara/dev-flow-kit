import fs from "node:fs/promises";

// 後続処理で “savedPath” からバイナリを取得する最短ヘルパ
export async function readBytesFromSavedPath(
  savedPath: string
): Promise<Uint8Array> {
  if (/^https?:\/\//.test(savedPath)) {
    const res = await fetch(savedPath);
    if (!res.ok) throw new Error("Failed to fetch file");
    return new Uint8Array(await res.arrayBuffer());
  }
  return new Uint8Array(await fs.readFile(savedPath));
}
