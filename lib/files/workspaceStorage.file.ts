// lib/storage/workspaceStorage.ts
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { put } from "@vercel/blob";

import { safeFileName } from "@/lib/files/safeFileName.file";
import { DEFAULT_MINE } from "@/contents/messages/mine.message";
import { FileMeta } from "@/contents/types/file.type";
import { ensureLocalDirs } from "./ensureDirs.file";
import { INPUT_DIR } from "@/contents/parametars/file.parametar";
import { driver, resolveLocalWritePath } from "./pathResolver.file";

/**
 * ファイ保存時の関数
 * @param file
 * @returns
 */
export async function saveInputFile(file: File): Promise<FileMeta> {
  const id = crypto.randomUUID();
  const name = safeFileName(file.name || `file-${id}`);
  const mime = file.type || DEFAULT_MINE;
  const uploadedAt = new Date().toISOString();

  if (driver() === "local") {
    await ensureLocalDirs();
    const buf = Buffer.from(await file.arrayBuffer());

    // パスの作成
    const savedName = `${id}-${name}`;
    const logicalPath = `${INPUT_DIR}/${savedName}`;
    const absPath = resolveLocalWritePath(logicalPath);

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
  const logicalPath = `${INPUT_DIR}/${savedName}`;
  const blob = await put(logicalPath, file, {
    access: "public",
    contentType: mime,
    allowOverwrite: true,
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
