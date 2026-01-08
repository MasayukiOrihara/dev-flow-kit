import { NOT_FOUND_ERROR } from "@/contents/messages/error.message";
import { deleteFromSavedPath } from "@/lib/files/bytesFromSavedPath.file";
import { ensureLocalDirs } from "@/lib/files/ensureDirs.file";
import { readMeta, writeMeta } from "@/lib/files/meta.file";
import { notFound } from "@/lib/guard/error.guard";
import fs from "node:fs/promises";

export const runtime = "nodejs";

/**
 * ファイル取得
 * @param _req
 * @param ctx
 * @returns
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const list = await readMeta();
  const meta = list.find((m) => m.id === id);

  if (!meta || !meta.savedPath) return notFound(NOT_FOUND_ERROR);

  const absPath = meta.savedPath;
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

/**
 * ファイル削除
 * @param _req
 * @param ctx
 * @returns
 */
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  await ensureLocalDirs();

  const list = await readMeta();
  const idx = list.findIndex((m) => m.id === id);

  if (idx === -1) return notFound(NOT_FOUND_ERROR);

  const meta = list[idx];
  if (!meta.savedPath) return notFound(NOT_FOUND_ERROR);

  const absPath = meta.savedPath;
  console.log(absPath);

  // 1) 実体削除（無くてもOK扱いにする）
  await deleteFromSavedPath(absPath);

  // 2) メタから削除
  const next = [...list.slice(0, idx), ...list.slice(idx + 1)];
  await writeMeta(next);

  return Response.json({ deleted: meta });
}
