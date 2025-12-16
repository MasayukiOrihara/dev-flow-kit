import { META_FILE } from "@/contents/parametars/file.parametar";
import { FileMeta } from "@/contents/types/file.type";
import fs from "node:fs/promises";

/**
 * メタ情報の読み込み
 * @returns
 */
export async function readMeta(): Promise<FileMeta[]> {
  try {
    const s = await fs.readFile(META_FILE, "utf-8");
    return JSON.parse(s) as FileMeta[];
  } catch {
    return [];
  }
}

/**
 * メタ情報の書き込み
 * @param list
 */
export async function writeMeta(list: FileMeta[]) {
  await fs.writeFile(META_FILE, JSON.stringify(list, null, 2), "utf-8");
}
