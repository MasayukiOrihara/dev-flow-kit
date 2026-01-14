import { FILENAME_NOTFOUND } from "@/contents/messages/error.message";
import { normalizeSpecTsxFileName } from "./normalizeSpecTsxFileName.code";

/** 本文から "CurriculumDetail.spec.tsx" のようなファイル名を抜く（最初の1つ） */
export function extractSpecFileName(text: string): string {
  // 例: "CurriculumDetail.spec.tsx" / "Foo.test.ts" などを拾う
  const m =
    text.match(/#\s*([\w.-]+)/) || // 見出し優先
    text.match(/\b[\w.-]+\.(ts|tsx)\b/) || // 次に拡張子あり
    text.match(/\b[\w.-]+\b/); // 最後の保険
  if (!m) throw new Error(FILENAME_NOTFOUND);
  return normalizeSpecTsxFileName(m[1] ?? m[0]);
}
