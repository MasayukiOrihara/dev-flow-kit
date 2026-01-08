import { JsonCell, JsonRow } from "@/contents/types/excel.type";

export function toJsonCell(v: unknown): JsonCell {
  if (v == null) return null;
  if (typeof v === "string") return v;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "boolean") return v;

  // ExcelJSのCellValueは複雑（Date, Hyperlink, Formula, RichTextなど）
  // まずは “文字列化” で安全に落とす
  if (v instanceof Date) return v.toISOString();

  // オブジェクト系は JSON 文字列にするか、空にするかは好み
  // 仕様書用途なら JSON文字列が無難
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export function rowValuesToJsonRow(values: unknown): JsonRow {
  // row.values は (CellValue | null)[] のような配列想定だが型が薄いので unknown を受ける
  const arr = Array.isArray(values) ? (values as unknown[]) : [];
  // ExcelJSは先頭[0]がnullになりがちなので slice(1)
  return arr.slice(1).map(toJsonCell);
}
