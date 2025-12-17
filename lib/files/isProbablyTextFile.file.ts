export function isProbablyTextFile(name: string, mime: string) {
  // mimeがoctet-streamでも拡張子で判断できるようにする
  if (mime.startsWith("text/")) return true;
  return /\.(ts|tsx|js|jsx|json|md|txt|yml|yaml|csv|html|css)$/i.test(name);
}
