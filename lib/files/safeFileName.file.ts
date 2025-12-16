import path from "node:path";

/**
 * ファイル名の安全化
 * @param original
 * @returns
 */
export function safeFileName(original: string) {
  // パストラバーサル対策：ファイル名だけ残す
  const base = path.basename(original);
  // 超ざっくり危険文字を除去（必要なら強化）
  return base.replace(/[^\w.\-()\[\] ]/g, "_");
}
