// ExcelJSの cell.value はオブジェクトになることがあるので正規化

type FormulaValue = {
  formula: unknown;
  result?: unknown;
};

type HyperlinkValue = {
  text?: unknown;
  hyperlink?: unknown;
};

type RichTextRun = {
  text?: unknown;
};

type RichTextValue = {
  richText: RichTextRun[];
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const isFormulaValue = (v: unknown): v is FormulaValue =>
  isRecord(v) && "formula" in v;

const isHyperlinkValue = (v: unknown): v is HyperlinkValue =>
  isRecord(v) && "hyperlink" in v;

const isRichTextValue = (v: unknown): v is RichTextValue =>
  isRecord(v) && Array.isArray((v as Record<string, unknown>).richText);

export function normalizeCellValue(v: unknown) {
  if (v == null) return null;

  // primitive
  if (typeof v === "string") return v;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "boolean") return v;

  // Date
  if (v instanceof Date) return v.toISOString();

  // Formula: { formula, result }
  if (isFormulaValue(v)) {
    return normalizeCellValue(v.result ?? null);
  }

  // Hyperlink: { text, hyperlink }
  if (isHyperlinkValue(v)) {
    if (typeof v.text === "string") return v.text;
    if (typeof v.hyperlink === "string") return v.hyperlink;
    return null;
  }

  // RichText: { richText: [...] }
  if (isRichTextValue(v)) {
    // ここでは richText が必ず配列
    return v.richText
      .map((r) => (typeof r.text === "string" ? r.text : ""))
      .join("");
  }

  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
