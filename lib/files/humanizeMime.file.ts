/**
 * ファイル情報を人間用に整形する型
 * @param mime
 * @returns
 */
export function humanizeMime(mime: string) {
  if (mime.includes("spreadsheet")) return "Excel (.xlsx)";
  if (mime.includes("wordprocessing")) return "Word (.docx)";
  if (mime === "application/pdf") return "PDF";
  return mime;
}
