import fs from "node:fs/promises";
import path from "path";
import { OUTPUT_DIR } from "@/contents/parametars/file.parametar";
import { FileMeta } from "@/contents/types/file.type";
import { safeFileName } from "../files/safeFileName.file";
import { EXCEL_MINE } from "@/contents/messages/mine.message";
import { readMeta, writeMeta } from "../files/meta.file";
import { Workbook } from "exceljs";
import { driver, resolveLocalWritePath } from "../files/pathResolver.file";
import { put } from "@vercel/blob";

/**
 * エクセルファイルを出力するときの処理
 * @param payload
 * @param type
 */
export async function exportFile(wb: Workbook, fileName: string) {
  // 保存名を決定
  //
  const baseName = `${safeFileName(fileName)}-testspec`;
  const ext = ".xlsx";

  // Blob では UUID or timestamp で衝突回避
  const uniqueSuffix = driver() === "blob" ? `-${Date.now()}` : "";

  const name = `${baseName}${uniqueSuffix}${ext}`;

  // Workbook → Buffer
  const buffer = await wb.xlsx.writeBuffer();
  let outPath = "";

  /* =====================
   * local 保存
   * ===================== */
  if (driver() === "local") {
    const dir = resolveLocalWritePath(OUTPUT_DIR); // 保存ディレクトリ
    await fs.mkdir(dir, { recursive: true });

    outPath = path.join(dir, name);

    // 同名ファイルが存在する場合は連番付与
    let index = 1;
    while (true) {
      try {
        await fs.access(outPath);
        const suffix = String(index).padStart(3, "0");
        outPath = path.join(dir, `${baseName}-${suffix}${ext}`);
        index++;
      } catch {
        break;
      }
    }
    // これで保存完了
    await fs.writeFile(outPath, Buffer.from(buffer));
  }

  /* =====================
   * blob 保存
   * ===================== */
  if (driver() === "blob") {
    outPath = `${OUTPUT_DIR}/${name}`;

    const blob = await put(outPath, Buffer.from(buffer), {
      access: "public",
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  }

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
