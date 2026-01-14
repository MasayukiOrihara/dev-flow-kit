import fs from "node:fs/promises";
import { del } from "@vercel/blob";
import { isHttpUrl, isVercelBlobUrl } from "../guard/file.guard";
import { isErrnoException } from "../guard/error.guard";
import { FILE_NOT_FOUND } from "@/contents/messages/error.message";

// 後続処理で “savedPath” からバイナリを取得する最短ヘルパ
export async function readBodyFromSavedPath(
  savedPath: string
): Promise<ArrayBuffer> {
  if (isHttpUrl(savedPath)) {
    const res = await fetch(savedPath);
    if (!res.ok) throw new Error("Failed to fetch file");
    return await res.arrayBuffer();
  }
  const buf = await fs.readFile(savedPath); // Buffer
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

/**
 * savedPath を削除する
 * - URL: （Vercel Blob想定なら）del(url) で削除
 * - ローカル: fs.unlink
 * - 無い/消えてる: OK（ENOENT は握りつぶす）
 */
export async function deleteFromSavedPath(savedPath: string): Promise<void> {
  if (isHttpUrl(savedPath)) {
    // “URLなら何でも消せる” は危険なので、Vercel Blob だけ削除対象
    if (!isVercelBlobUrl(savedPath)) {
      throw new Error("This URL is not deletable by this app");
    }
    // Blob削除（URLでも pathname でもOKな想定）
    await del(savedPath);
    return;
  }
  try {
    await fs.unlink(savedPath);
  } catch (e: unknown) {
    // ファイルが既に無い場合だけ握りつぶす（それ以外は投げる）
    if (isErrnoException(e) && e.code === "ENOENT") {
      console.warn(FILE_NOT_FOUND);
      return;
    } else {
      throw e;
    }
  }
}
