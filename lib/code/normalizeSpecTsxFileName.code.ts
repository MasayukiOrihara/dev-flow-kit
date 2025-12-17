import path from "node:path";

/** 任意の名前 → 必ず *.spec.tsx にする */
export function normalizeSpecTsxFileName(rawName: string): string {
  const base = path.basename(rawName);

  // すでに .spec.tsx
  if (base.endsWith(".spec.tsx")) return base;

  // .tsx / .ts が付いている場合
  if (base.endsWith(".tsx") || base.endsWith(".ts")) {
    return base.replace(/\.(tsx|ts)$/, ".spec.tsx");
  }

  // 拡張子なし
  return `${base}.spec.tsx`;
}
