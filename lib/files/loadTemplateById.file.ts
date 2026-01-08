import { TEMPLATE_INDEX } from "@/contents/parametars/file.parametar";
import { FormatMeta } from "@/contents/types/prompt.type";
import fs from "node:fs/promises";
import path from "node:path";
import { readBodyFromSavedPath } from "./bytesFromSavedPath.file";

/**
 * テンプレIDからプロンプト本文を取得する
 */
export async function loadTemplateById(
  formatId: string,
  templateDir: string
): Promise<string> {
  // ① formatId のガード（超重要）
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(formatId)) {
    throw new Error("Invalid template id");
  }

  // ② index.json を読む（許可リスト）
  const ab = await readBodyFromSavedPath(TEMPLATE_INDEX);
  const indexRaw = new TextDecoder("utf-8").decode(ab);
  const parsed: unknown = JSON.parse(indexRaw);
  const formats: FormatMeta[] = Array.isArray(parsed)
    ? (parsed as FormatMeta[])
    : [];

  const meta = formats.find((f) => f.id === formatId && f.enabled);

  if (!meta) {
    throw new Error(`Template not found or disabled: ${formatId}`);
  }

  // ③ 実体ファイルを読む
  const templatePath = path.join(templateDir, `${formatId}.txt`);

  try {
    return await fs.readFile(templatePath, "utf-8");
  } catch {
    throw new Error(`Template file missing: ${formatId}`);
  }
}
