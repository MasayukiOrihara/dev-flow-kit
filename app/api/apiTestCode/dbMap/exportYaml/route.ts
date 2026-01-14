import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { extractYamlCodeBlock } from "@/lib/code/extractCodeBlock.code";
import {
  CODEBLOCK_NOT_FOUND,
  UNKNOWN_ERROR,
} from "@/contents/messages/error.message";
import { OUTPUT_DIR } from "@/contents/parametars/file.parametar";
import { readMeta, writeMeta } from "@/lib/files/meta.file";
import { DEFAULT_MINE } from "@/contents/messages/mine.message";
import { FileMeta } from "@/contents/types/file.type";
import { NextResponse } from "next/server";
import { notFound } from "@/lib/guard/error.guard";

export async function POST(req: Request) {
  try {
    const { llmText } = await req.json();

    const id = crypto.randomUUID();
    const outDir = OUTPUT_DIR;
    const nameId = id.replace(/-/g, "").slice(0, 12);
    const fileName = `api-db-map-${nameId}.yaml`;
    const code = extractYamlCodeBlock(llmText);

    // ガード
    if (!code) return notFound(CODEBLOCK_NOT_FOUND);

    // 念のためファイル名を安全化（パストラバーサル対策）
    const safeFileName = path.basename(fileName);
    await fs.mkdir(outDir, { recursive: true });
    const filePath = path.join(outDir, safeFileName);

    await fs.writeFile(filePath, code, "utf8");

    // メタデータに書き出し
    const metaList = await readMeta();

    const buf = new TextEncoder().encode(code);

    const meta: FileMeta = {
      id,
      name: safeFileName,
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
    return NextResponse.json({ error: UNKNOWN_ERROR }, { status: 500 });
  }
}
