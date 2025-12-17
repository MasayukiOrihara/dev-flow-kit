import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { extractCodeBlock } from "@/lib/code/extractCodeBlock.code";
import { extractSpecFileName } from "@/lib/code/extractSpecFileName.code";
import { NOT_FOUND_CODE_ERROR } from "@/contents/messages/error.message";
import { notFound } from "@/lib/guard/api.guard";
import { OUTPUT_DIR } from "@/contents/parametars/file.parametar";
import { readMeta, writeMeta } from "@/lib/files/meta.file";
import { DEFAULT_MINE } from "@/contents/messages/mine.message";
import { FileMeta } from "@/contents/types/file.type";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { llmText } = await req.json();

    const outDir = OUTPUT_DIR;
    const fileName = extractSpecFileName(llmText);
    const code = extractCodeBlock(llmText);

    // ガード
    if (!code) return notFound(NOT_FOUND_CODE_ERROR);

    // 念のためファイル名を安全化（パストラバーサル対策）
    const safeFileName = path.basename(fileName);
    await fs.mkdir(outDir, { recursive: true });
    const filePath = path.join(outDir, safeFileName);

    await fs.writeFile(filePath, code, "utf8");

    // メタデータに書き出し
    const metaList = await readMeta();
    const id = crypto.randomUUID();
    const buf = new TextEncoder().encode(code);

    const meta: FileMeta = {
      id,
      name: fileName,
      size: buf.length,
      mime: DEFAULT_MINE,
      savedPath: filePath,
      uploadedAt: new Date().toISOString(),
    };

    metaList.unshift(meta);
    await writeMeta(metaList); // 書き込み

    return NextResponse.json({ fileName });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Excel 読み込みエラー" },
      { status: 500 }
    );
  }
}
