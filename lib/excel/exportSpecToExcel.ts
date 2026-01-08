// lib/exportSpecToExcel.ts
import { CONFIG } from "@/contents/parametars/excel.parametar";
import { Payload, TestType } from "@/contents/types/excel.type";
import ExcelJS from "exceljs";

/**
 * エクセルファイルの作成
 * @param payload
 * @param type
 * @returns
 */
export async function buildWorkbook(payload: Payload, type: TestType) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("仕様書");

  const conf = CONFIG[type];

  // 共通ヘッダ
  ws.mergeCells("A1:C1");
  ws.getCell("A1").value = "No";
  ws.getCell("A2").value = "大";
  ws.getCell("B2").value = "中";
  ws.getCell("C2").value = "小";

  ws.mergeCells("D1:E1");
  ws.getCell("D1").value = "機能（メソッド・関数）";
  ws.getCell("D2").value = "ID";
  ws.getCell("E2").value = "名称";

  ws.mergeCells("F1:G1");
  ws.getCell("F1").value = "確認内容";
  ws.getCell("F2").value = "大項目";
  ws.getCell("G2").value = "中項目";

  ws.mergeCells("H1:H2");
  ws.getCell("H1").value = "テスト手順";
  ws.mergeCells("I1:I2");
  ws.getCell("I1").value = "期待値";
  ws.mergeCells("J1:J2");
  ws.getCell("J1").value = "実施日";
  ws.mergeCells("K1:K2");
  ws.getCell("K1").value = "実施結果";

  // type別ヘッダ（前提条件/備考）
  conf.extraHeaders.forEach((h) => {
    if (h.merge) ws.mergeCells(h.merge);
    ws.getCell(h.addr).value = h.value;
  });

  // 幅
  ws.columns = conf.cols.map((c) => ({ width: c.width }));

  // ヘッダ体裁
  [1, 2].forEach((r) => {
    ws.getRow(r).font = { bold: true };
    ws.getRow(r).alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
  });

  // 背景（typeで増減）
  const headerCells = [
    "A1",
    "B2",
    "C2",
    "D1",
    "D2",
    "E2",
    "F1",
    "F2",
    "G2",
    "H1",
    "I1",
    "J1",
    "K1",
    ...conf.headerCells, // ★ L/Mはtype依存
  ];
  headerCells.forEach((addr) => {
    ws.getCell(addr).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE8F0FE" },
    };
  });

  const jl = (arr?: string[]) => (arr?.length ? "• " + arr.join("\n• ") : "");

  // 行データ（preconditionはsystemのときだけ差し込む）
  payload.cases.forEach((c) => {
    ws.addRow([
      c.no_dai,
      c.no_chu,
      c.no_sho,
      c.func_id,
      c.func_name,
      c.check_major,
      c.check_middle,
      jl(c.steps),
      jl(c.expected),
      c.exec_date ?? "",
      c.exec_result ?? "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(type === "system" ? [jl((c as any).precondition)] : []), // ★ここ
      jl(c.remarks),
    ]);
  });

  ws.eachRow((row, i) => {
    row.eachCell((cell) => {
      cell.alignment = { vertical: "top", wrapText: true };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
    if (i > 2) row.height = 22;
  });

  return wb;
}
