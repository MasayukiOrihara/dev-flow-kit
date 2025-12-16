import { INPUT_DIR } from "@/contents/parametars/file.parametar";
import { ensureDirs } from "@/lib/files/ensureDirs.file";
import { readMeta, writeMeta } from "@/lib/files/meta.file";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const list = await readMeta();
  const meta = list.find((m) => m.id === id);

  if (!meta || !meta.savedPath) {
    return Response.json({ error: "not found" }, { status: 404 });
  }

  const absPath = path.join(INPUT_DIR, meta.savedPath);
  const buf = await fs.readFile(absPath);

  // ブラウザで開ける/ダウンロードできる形で返す
  return new Response(buf, {
    headers: {
      "Content-Type": meta.mime,
      "Content-Disposition": `inline; filename="${encodeURIComponent(
        meta.name
      )}"`,
    },
  });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  await ensureDirs();

  const list = await readMeta();
  const idx = list.findIndex((m) => m.id === id);

  if (idx === -1) return Response.json({ error: "not found" }, { status: 404 });

  const meta = list[idx];
  if (!meta.savedPath) {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  const absPath = path.join(INPUT_DIR, meta.savedPath);

  // 1) 実体削除（無くてもOK扱いにする）
  try {
    await fs.unlink(absPath);
  } catch (e: any) {
    // ファイルが既に無い場合だけ握りつぶす（それ以外は投げる）
    if (e?.code !== "ENOENT") throw e;
  }

  // 2) メタから削除
  const next = [...list.slice(0, idx), ...list.slice(idx + 1)];
  await writeMeta(next);

  return Response.json({ deleted: meta });
}
