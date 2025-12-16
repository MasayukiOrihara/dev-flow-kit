// app/api/excel-to-json-by-name/route.ts
import { INPUT_DIR } from "@/contents/parametars/file.parametar";
import { readMeta } from "@/lib/files/meta.file";
import fs from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";

export const runtime = "nodejs";

function isProbablyExcelFile(name: string, mime: string) {
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

// ExcelJSの cell.value はオブジェクトになることがあるので正規化（必要最低限）
function normalizeCellValue(v: any) {
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

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const fileName = body?.fileName;

  // ガード：必須 & 文字列
  if (typeof fileName !== "string" || fileName.trim() === "") {
    return Response.json(
      { error: "ファイル名が取得できませんでした" },
      { status: 400 }
    );
  }

  // ファイル一覧を取得
  const list = await readMeta();

  // 同名が複数ある可能性があるので最新(uploadedAtが新しい)を優先
  const candidates = list.filter((m) => m.name === fileName);
  if (candidates.length === 0) {
    return Response.json(
      { error: "ファイルが見つかりませんでした" },
      { status: 404 }
    );
  }

  // ファイル情報の取得
  const meta = candidates
    .slice()
    .sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1))[0];

  if (!isProbablyExcelFile(meta.name, meta.mime)) {
    return Response.json(
      {
        error: "Excelファイルではありませんでした",
        mime: meta.mime,
        name: meta.name,
      },
      { status: 400 }
    );
  }

  // ファイルの取得
  if (!meta.savedPath) {
    return Response.json(
      { error: "ファイルが見つかりませんでした" },
      { status: 404 }
    );
  }
  const absPath = path.join(INPUT_DIR, meta.savedPath);

  console.log("エクセルファイル取得中...");
  // ExcelはBufferで読む
  const buf = await fs.readFile(absPath);

  // Buffer -> ArrayBuffer（中身だけを切り出すのが重要）
  const arrayBuffer = buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength
  );

  // Excel → JSON
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const sheetsJson: Record<string, any[]> = {};

  workbook.eachSheet((worksheet) => {
    const rows: any[] = [];

    // 列数を揃えたい場合（行ごとに末尾セル数がブレる対策）
    let maxCols = 0;
    worksheet.eachRow((row) => {
      maxCols = Math.max(maxCols, row.actualCellCount);
    });

    worksheet.eachRow((row) => {
      const arr: any[] = [];
      for (let i = 1; i <= maxCols; i++) {
        arr.push(normalizeCellValue(row.getCell(i).value));
      }
      rows.push(arr);
    });

    sheetsJson[worksheet.name] = rows;
  });
  console.log("Excel取得 → JSON出力");

  return Response.json({
    file: {
      id: meta.id,
      name: meta.name,
      mime: meta.mime,
      uploadedAt: meta.uploadedAt,
    },
    sheets: sheetsJson,
  });
}
