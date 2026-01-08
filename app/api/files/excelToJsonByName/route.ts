// app/api/excel-to-json-by-name/route.ts
import { readMeta } from "@/lib/files/meta.file";
import fs from "node:fs/promises";
import ExcelJS from "exceljs";
import { reqString } from "@/lib/guard/api.guard";
import * as ERR from "@/contents/messages/error.message";
import { normalizeCellValue } from "@/lib/files/normalizeCellValue.file";
import { badRequest, notFound } from "@/lib/guard/error.guard";
import { JsonRow, SheetsJson } from "@/contents/types/excel.type";
import { isProbablyExcelFile } from "@/lib/files/isProbably.file";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body: unknown = await req.json().catch(() => ({}));

  const fileName = reqString(body, "fileName", ERR.FILENAME_ERROR);
  if (fileName instanceof Response) return fileName;

  // ファイル一覧を取得
  const list = await readMeta();
  // 同名が複数ある可能性があるので最新(uploadedAtが新しい)を優先
  const candidates = list.filter((m) => m.name === fileName);
  if (candidates.length === 0) return notFound(ERR.NOT_FOUND_ERROR);

  // ファイル情報の取得
  const meta = candidates
    .slice()
    .sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1))[0];

  if (!isProbablyExcelFile(meta.name, meta.mime)) {
    return badRequest(ERR.NOT_EXCEL_ERROR);
  }

  // ファイルの取得
  if (!meta.savedPath) return notFound(ERR.NOT_FOUND_ERROR);

  const absPath = meta.savedPath;

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

  const sheetsJson: SheetsJson = {};

  workbook.eachSheet((worksheet) => {
    const rows: JsonRow[] = [];

    // 列数を揃えたい場合（行ごとに末尾セル数がブレる対策）
    let maxCols = 0;
    worksheet.eachRow((row) => {
      maxCols = Math.max(maxCols, row.actualCellCount);
    });

    worksheet.eachRow((row) => {
      const arr: JsonRow = [];
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
