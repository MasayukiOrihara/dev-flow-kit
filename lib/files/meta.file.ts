import { META_FILE } from "@/contents/parametars/file.parametar";
import { FileMeta } from "@/contents/types/file.type";
import fs from "node:fs/promises";
import { put, list } from "@vercel/blob";
import { ensureLocalDirs } from "./ensureDirs.file";
import { driver } from "./pathResolver.file";

/**
 * メタ情報の読み込み(local <-> blob 対応版)
 * @returns
 */
export async function readMeta(): Promise<FileMeta[]> {
  // local: ローカル保存
  if (driver() === "local") {
    try {
      await ensureLocalDirs();
      const s = await fs.readFile(META_FILE, "utf-8");
      const json = JSON.parse(s);

      return Array.isArray(json) ? (json as FileMeta[]) : [];
    } catch {
      return [];
    }
  }

  // blob: pathname一致のblobを探してfetch
  try {
    const { blobs } = await list({ prefix: META_FILE, limit: 1 });
    const metaBlob = blobs.find((b) => b.pathname === META_FILE);
    if (!metaBlob) return [];

    const res = await fetch(metaBlob.url);
    if (!res.ok) return [];

    const json = await res.json().catch(() => []);
    return Array.isArray(json) ? (json as FileMeta[]) : [];
  } catch {
    return [];
  }
}

/**
 * メタ情報の書き込み local <-> blob 対応版
 * @param list
 */
export async function writeMeta(list: FileMeta[]) {
  if (driver() === "local") {
    await ensureLocalDirs();
    await fs.writeFile(META_FILE, JSON.stringify(list, null, 2), "utf-8");
    return;
  }

  // blob: 同じ pathname に上書き（最短）
  await put(META_FILE, JSON.stringify(list, null, 2), {
    access: "public", // とりあえず public
    contentType: "application/json",
    addRandomSuffix: false,
  });
}
