import * as ERR from "@/contents/messages/error.message";
import { isProbablyTextFile } from "@/lib/files/isProbably.file";
import { readMeta } from "@/lib/files/meta.file";
import { reqString } from "@/lib/guard/api.guard";
import { badRequest, notFound } from "@/lib/guard/error.guard";
import fs from "node:fs/promises";

export const runtime = "nodejs";

/**
 * ファイル名を受け取りテキストで返すAPI
 * @param req
 * @returns
 */
export async function POST(req: Request) {
  const body: unknown = await req.json().catch(() => ({}));

  // ファイル名の取得
  const fileName = reqString(body, "fileName", ERR.FILENAME_ERROR);
  if (fileName instanceof Response) return fileName;

  // ファイル一覧を取得
  const list = await readMeta();
  // 同名が複数ある可能性があるので、最新(uploadedAtが新しい)を優先
  const candidates = list.filter((m) => m.name === fileName);
  if (candidates.length === 0) return notFound(ERR.NOT_FOUND_ERROR);

  // ファイル情報の取得
  const meta = candidates
    .slice()
    .sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1))[0];
  if (!isProbablyTextFile(meta.name, meta.mime)) {
    return badRequest(ERR.NOT_TEXT_ERROR);
  }

  // ファイルの取得
  if (!meta.savedPath) return notFound(ERR.NOT_FOUND_ERROR);
  const absPath = meta.savedPath;

  console.log("コードファイル取得中...");
  // utf-8として読む（コード/仕様書前提）
  const text = await fs.readFile(absPath, "utf-8");

  console.log("コード取得 → テキスト出力");
  return Response.json({
    file: {
      id: meta.id,
      name: meta.name,
      mime: meta.mime,
      uploadedAt: meta.uploadedAt,
    },
    text,
  });
}
