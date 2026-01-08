import { INPUT_DIR, META_DIR } from "@/contents/parametars/file.parametar";
import fs from "node:fs/promises";
import { driver, resolveLocalWritePath } from "./pathResolver.file";

/**
 * ディレクトリの作成
 */
export async function ensureLocalDirs() {
  if (driver() === "local") {
    const absInputPath = resolveLocalWritePath(INPUT_DIR);
    const absMetaPath = resolveLocalWritePath(META_DIR);

    // 作成
    await fs.mkdir(absInputPath, { recursive: true });
    await fs.mkdir(absMetaPath, { recursive: true });
  }
}
