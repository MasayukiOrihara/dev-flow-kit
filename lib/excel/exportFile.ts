import { readMeta, writeMeta } from "../files/meta.file";
import { Workbook } from "exceljs";
import { saveInputFile } from "../files/workspaceStorage.file";

/**
 * エクセルファイルを出力するときの処理
 * @param payload
 * @param type
 */
export async function exportFile(wb: Workbook, fileName: string) {
  // 作成したエクセルファイルをfileに変換
  const buffer = await wb.xlsx.writeBuffer();
  const file = new File([buffer], `${fileName}-testspec.xlsx`, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  // メタデータの取得
  const meta = await saveInputFile(file);

  // ここでmeta情報に記録
  const metaList = await readMeta();

  metaList.unshift(meta);
  await writeMeta(metaList); // 書き込み

  console.log(`✅ Excel出力完了: ${meta.savedPath}`);
}
