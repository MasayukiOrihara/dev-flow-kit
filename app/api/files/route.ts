import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { FileMeta } from "@/contents/types/file.type";
import { ensureDirs } from "@/lib/files/ensureDirs.file";
import { readMeta, writeMeta } from "@/lib/files/meta.file";
import { safeFileName } from "@/lib/files/safeFileName.file";
import { INPUT_DIR } from "@/contents/parametars/file.parametar";

// fsを使うのでNode runtime
export const runtime = "nodejs";

/**
 * アップロードAPI
 * @param req
 * @returns
 */
export async function POST(req: Request) {
  await ensureDirs();

  const form = await req.formData();
  const files = form.getAll("files");
  // ガード
  if (!files.length) {
    return Response.json({ error: "files is required" }, { status: 400 });
  }

  const metaList = await readMeta();
  const saved: FileMeta[] = [];

  for (const item of files) {
    if (!(item instanceof File)) continue;

    const id = crypto.randomUUID();
    const name = safeFileName(item.name || `file-${id}`);
    const buf = Buffer.from(await item.arrayBuffer());
    const savedPath = `${id}-${name}`;
    const absPath = path.join(INPUT_DIR, savedPath);

    await fs.writeFile(absPath, buf);

    const meta: FileMeta = {
      id,
      name,
      size: buf.length,
      mime: item.type || "application/octet-stream",
      savedPath,
      uploadedAt: new Date().toISOString(),
    };

    metaList.unshift(meta);
    saved.push(meta);
  }

  await writeMeta(metaList);

  return Response.json({ saved });
}

// メタ情報の取得
export async function GET() {
  await ensureDirs();
  const metaList = await readMeta();
  return Response.json({ files: metaList });
}
