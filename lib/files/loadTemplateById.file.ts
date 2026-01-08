import { TEMPLATE_INDEX } from "@/contents/parametars/file.parametar";
import { FormatMeta } from "@/contents/types/prompt.type";
import fs from "node:fs/promises";
import path from "node:path";

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
  const indexRaw = await fs.readFile(TEMPLATE_INDEX, "utf-8");
  const formats = JSON.parse(indexRaw) as FormatMeta[];

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
