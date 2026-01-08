// app/api/excel-to-json/route.ts
import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { SEND_FILE_ERROR } from "@/contents/messages/error.message";
import { badRequest } from "@/lib/guard/api.guard";
import {
  JsonRow,
  rowValuesToJsonRow,
  SheetsJson,
} from "@/lib/excel/toJsonCell";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return badRequest(SEND_FILE_ERROR);
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const sheetsJson: SheetsJson = {};

    workbook.eachSheet((worksheet) => {
      const rows: JsonRow[] = [];

      worksheet.eachRow((row) => {
        const jsonRow = rowValuesToJsonRow(row.values);
        // ExcelJS の row.values[0] は null ⇒切り捨て
        rows.push(jsonRow);
      });

      sheetsJson[worksheet.name] = rows;
    });

    return NextResponse.json({ sheets: sheetsJson });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Excel 読み込みエラー" },
      { status: 500 }
    );
  }
}
