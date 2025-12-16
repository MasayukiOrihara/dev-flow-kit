import { INPUT_DIR } from "@/contents/parametars/file.parametar";
import { readMeta } from "@/lib/files/meta.file";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

function isProbablyTextFile(name: string, mime: string) {
  // mimeがoctet-streamでも拡張子で判断できるようにする
  if (mime.startsWith("text/")) return true;
  return /\.(ts|tsx|js|jsx|json|md|txt|yml|yaml|csv|html|css)$/i.test(name);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const fileName = body?.fileName;

  // ガード：必須 & 文字列
  if (typeof fileName !== "string" || fileName.trim() === "") {
    return Response.json(
      { error: "ファイル名が取得できませんでした" },
      { status: 400 }
    );
  }

  // ファイル一覧を取得
  const list = await readMeta();

  // 同名が複数ある可能性があるので、最新(uploadedAtが新しい)を優先
  const candidates = list.filter((m) => m.name === fileName);
  if (candidates.length === 0) {
    return Response.json(
      { error: "ファイルが見つかりませんでした" },
      { status: 404 }
    );
  }

  // ファイル情報の取得
  const meta = candidates
    .slice()
    .sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1))[0];
  if (!isProbablyTextFile(meta.name, meta.mime)) {
    return Response.json(
      {
        error: "テキストファイルではありませんでした",
        mime: meta.mime,
        name: meta.name,
      },
      { status: 400 }
    );
  }

  // ファイルの取得
  if (!meta.savedPath) {
    return Response.json(
      { error: "ファイルが見つかりませんでした" },
      { status: 404 }
    );
  }
  const absPath = path.join(INPUT_DIR, meta.savedPath);

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
