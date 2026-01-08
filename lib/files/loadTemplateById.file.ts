import { TEMPLATE_INDEX } from "@/contents/parametars/file.parametar";
import { FormatMeta } from "@/contents/types/prompt.type";
import path from "node:path";
import { readBodyFromSavedPath } from "./bytesFromSavedPath.file";
import { resolveReadPath } from "./pathResolver.file";

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
  const savedPath = resolveReadPath(TEMPLATE_INDEX);
  const ab = await readBodyFromSavedPath(savedPath);
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
  try {
    const templatePath = path.join(templateDir, `${formatId}.txt`);
    const adsPath = resolveReadPath(templatePath);

    // ファイル取得
    const buf = await readBodyFromSavedPath(adsPath);
    const text = new TextDecoder("utf-8").decode(buf);

    return text;
  } catch {
    throw new Error(`Template file missing: ${formatId}`);
  }
}
