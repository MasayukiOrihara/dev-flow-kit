import { INPUT_DIR, META_DIR } from "@/contents/parametars/file.parametar";
import fs from "node:fs/promises";

/**
 * ディレクトリの作成
 */
export async function ensureDirs() {
  await fs.mkdir(INPUT_DIR, { recursive: true });
  await fs.mkdir(META_DIR, { recursive: true });
}
