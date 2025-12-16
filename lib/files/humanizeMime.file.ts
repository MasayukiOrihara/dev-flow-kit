/**
 * ファイル情報を人間用に整形する型
 * @param mime
 * @returns
 */
export function humanizeMime(mime: string, name: string) {
  // MINE 判断
  if (mime.includes("spreadsheet")) return "Excel (.xlsx)";
  if (mime.includes("wordprocessing")) return "Word (.docx)";
  if (mime === "application/pdf") return "PDF";

  // 名前判断
  if (name.endsWith(".tsx")) return "TypeScript (.tsx)";
  if (name.endsWith(".ts")) return "TypeScript (.ts)";
  if (name.endsWith(".js")) return "JavaScript (.js)";
  if (name.endsWith(".md")) return "Markdown";

  // 不明
  return mime;
}
