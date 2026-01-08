import fs from "fs";
import path from "path";
import { OUTPUT_DIR } from "@/contents/parametars/file.parametar";
import { FileMeta } from "@/contents/types/file.type";
import { safeFileName } from "../files/safeFileName.file";
import { EXCEL_MINE } from "@/contents/messages/mine.message";
import { readMeta, writeMeta } from "../files/meta.file";
import { Workbook } from "exceljs";

/**
 * エクセルファイルを出力するときの処理
 * @param payload
 * @param type
 */
export async function exportFile(wb: Workbook, fileName: string) {
  // 保存名を決定
  const dir = path.resolve(OUTPUT_DIR); // 保存ディレクトリ
  const baseName = `${safeFileName(fileName)}-testspec`;
  const ext = ".xlsx";

  const name = `${baseName}${ext}`;
  let outPath = path.join(dir, name);

  // 同名ファイルが存在する場合は連番付与
  let index = 1;
  while (fs.existsSync(outPath)) {
    const suffix = String(index).padStart(3, "0"); // 001, 002...
    outPath = path.join(dir, `${baseName}-${suffix}${ext}`);
    index++;
  }
  await wb.xlsx.writeFile(outPath); // ← これで保存完了

  // ここでmeta情報に記録
  const metaList = await readMeta();
  const id = crypto.randomUUID();
  const buf = await wb.xlsx.writeBuffer();

  const meta: FileMeta = {
    id,
    name,
    size: buf.byteLength,
    mime: EXCEL_MINE,
    savedPath: outPath,
    uploadedAt: new Date().toISOString(),
  };

  metaList.unshift(meta);
  await writeMeta(metaList); // 書き込み

  console.log(`✅ Excel出力完了: ${outPath}`);
}
