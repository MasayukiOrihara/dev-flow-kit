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
