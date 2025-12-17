// app/api/excel-to-json/route.ts
import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { SEND_FILE_ERROR } from "@/contents/messages/error.message";
import { badRequest } from "@/lib/guard/api.guard";

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

    const sheetsJson: Record<string, any[]> = {};

    workbook.eachSheet((worksheet, _sheetId) => {
      const rows: any[] = [];

      worksheet.eachRow((row, _rowNumber) => {
        const rowValues = row.values as any[];
        // ExcelJS の row.values[0] は null ⇒切り捨て
        rows.push(rowValues.slice(1));
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
