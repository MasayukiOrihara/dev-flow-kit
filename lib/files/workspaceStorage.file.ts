// lib/storage/workspaceStorage.ts
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { put } from "@vercel/blob";

import { safeFileName } from "@/lib/files/safeFileName.file";
import { DEFAULT_MINE } from "@/contents/messages/mine.message";
import { FileMeta } from "@/contents/types/file.type";
import { ensureLocalDirs } from "./ensureDirs.file";
import { INPUT_DIR } from "@/contents/parametars/file.parametar";

export function driver(): "local" | "blob" {
  return process.env.STORAGE_DRIVER === "blob" ? "blob" : "local";
}

export async function saveInputFile(file: File): Promise<FileMeta> {
  const id = crypto.randomUUID();
  const name = safeFileName(file.name || `file-${id}`);
  const mime = file.type || DEFAULT_MINE;
  const uploadedAt = new Date().toISOString();

  if (driver() === "local") {
    await ensureLocalDirs();
    const buf = Buffer.from(await file.arrayBuffer());
    const savedName = `${id}-${name}`;
    const absPath = path.join(INPUT_DIR, savedName);
    await fs.writeFile(absPath, buf);

    return {
      id,
      name,
      size: buf.length,
      mime,
      savedPath: absPath, // 今まで通り
      uploadedAt,
    };
  }

  // blob
  const savedName = `${id}-${name}`;
  const blob = await put(`${INPUT_DIR}/${savedName}`, file, {
    access: "public",
    contentType: mime,
    addRandomSuffix: false,
  });

  return {
    id,
    name,
    size: file.size,
    mime,
    savedPath: blob.url, // ←最短で後続を壊さないため URL を入れる
    uploadedAt,
  };
}

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
