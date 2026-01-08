/**
 * excel の mine 判定
 * @param name
 * @param mime
 * @returns
 */
export function isProbablyExcelFile(name: string, mime: string) {
  // mimeがoctet-streamでも拡張子で判断できるようにする
  if (
    mime ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mime === "application/vnd.ms-excel"
  ) {
    return true;
  }
  return /\.(xlsx|xls)$/i.test(name);
}

/**
 * テキストファイルの mine 判定
 * @param name
 * @param mime
 * @returns
 */
export function isProbablyTextFile(name: string, mime: string) {
  // mimeがoctet-streamでも拡張子で判断できるようにする
  if (mime.startsWith("text/")) return true;
  return /\.(ts|tsx|js|jsx|json|md|txt|yml|yaml|csv|html|css)$/i.test(name);
}
