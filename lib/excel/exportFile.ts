import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { buildWorkbook, Payload } from "./exportSpecToExcel";


export async function exportFile(payload: Payload) {
  const wb = await buildWorkbook(payload);

  const dir = path.resolve("./public/output/"); // 保存ディレクトリ
  const baseName = `${payload.fileName}-testspec`;
  const ext = ".xlsx";
  let outPath =  path.join(dir, `${baseName}${ext}`);

  // 同名ファイルが存在する場合は連番付与
  let index = 1;
  while (fs.existsSync(outPath)) {
    const suffix = String(index).padStart(3, "0"); // 001, 002...
    outPath = path.join(dir, `${baseName}-${suffix}${ext}`);
    index++;
  }
  await wb.xlsx.writeFile(outPath);   // ← これで保存完了
  console.log(`✅ Excel出力完了: ${outPath}`);
}
