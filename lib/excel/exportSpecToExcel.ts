// lib/exportSpecToExcel.ts
import ExcelJS from "exceljs";
import { ComprehensiveTestCaseRow, TestCaseRow } from "../schema";

//export type Payload = { fileName: string; cases: ComprehensiveTestCaseRow[] };
export type Payload = { fileName: string; cases: TestCaseRow[] };

export async function buildWorkbook(payload: Payload) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("仕様書");

  // 見出し（2段ヘッダ）
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
  ws.mergeCells("L1:L2");
  ws.getCell("L1").value = "前提条件";
  ws.mergeCells("M1:M2");
  ws.getCell("M1").value = "備考";

  // 幅・体裁
  const widths = [6, 6, 6, 14, 28, 22, 40, 44, 44, 12, 12, 44, 44];
  ws.columns = widths.map((w) => ({ width: w }));
  [1, 2].forEach((r) => {
    ws.getRow(r).font = { bold: true };
    ws.getRow(r).alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
  });

  // 罫線・背景
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
    "L1",
    "M1",
  ];
  headerCells.forEach((addr) => {
    const c = ws.getCell(addr);
    c.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE8F0FE" },
    }; // 薄緑系など任意
  });

  // データ行投入
  const jl = (arr: string[]) =>
    arr && arr.length ? "• " + arr.join("\n• ") : "";

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
      //jl(c.precondition),
      jl(c.remarks),
    ]);
  });

  // 行スタイル
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
    if (i > 2) row.height = 22; // データ行の高さ微調整
  });

  return wb;
}
