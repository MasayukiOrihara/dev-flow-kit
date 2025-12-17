import { normalizeSpecTsxFileName } from "./normalizeSpecTsxFileName.code";

/** 本文から "CurriculumDetail.spec.tsx" のようなファイル名を抜く（最初の1つ） */
export function extractSpecFileName(text: string): string {
  // 例: "CurriculumDetail.spec.tsx" / "Foo.test.ts" などを拾う
  const m =
    text.match(/#\s*([\w.-]+)/) || // 見出し優先
    text.match(/\b[\w.-]+\.(ts|tsx)\b/) || // 次に拡張子あり
    text.match(/\b[\w.-]+\b/); // 最後の保険
  if (!m) throw new Error("ファイル名が本文から見つかりません");
  return normalizeSpecTsxFileName(m[1] ?? m[0]);
}
