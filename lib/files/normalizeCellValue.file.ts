// ExcelJSの cell.value はオブジェクトになることがあるので正規化（必要最低限）
export function normalizeCellValue(v: any) {
  if (v == null) return null;

  // Date
  if (v instanceof Date) return v.toISOString();

  // Formula: { formula, result }
  if (typeof v === "object" && "formula" in v) {
    return v.result ?? null; // 必要なら { formula: v.formula, result: v.result }
  }

  // Hyperlink: { text, hyperlink }
  if (typeof v === "object" && "hyperlink" in v) {
    return v.text ?? v.hyperlink;
  }

  // RichText: { richText: [...] }
  if (typeof v === "object" && "richText" in v) {
    return v.richText?.map((r: any) => r.text).join("") ?? "";
  }

  return v; // number/string/boolean など
}
