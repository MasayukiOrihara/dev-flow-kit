import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

// fsを使うのでNode runtime
export const runtime = "nodejs";

const INPUT_DIR = process.env.INPUT_DIR ?? "./workspace/inputs";
const META_DIR = process.env.META_DIR ?? "./workspace/meta";
const META_FILE = path.join(META_DIR, "files.json");

type FileMeta = {
  id: string;
  name: string;
  size: number;
  mime: string;
  savedPath: string; // inputs配下の相対パス
  uploadedAt: string; // ISO
};

/**
 * ディレクトリの作成
 */
async function ensureDirs() {
  await fs.mkdir(INPUT_DIR, { recursive: true });
  await fs.mkdir(META_DIR, { recursive: true });
}

/**
 * メタ情報の読み込み
 * @returns
 */
async function readMeta(): Promise<FileMeta[]> {
  try {
    const s = await fs.readFile(META_FILE, "utf-8");
    return JSON.parse(s) as FileMeta[];
  } catch {
    return [];
  }
}

/**
 * メタ情報の書き込み
 * @param list
 */
async function writeMeta(list: FileMeta[]) {
  await fs.writeFile(META_FILE, JSON.stringify(list, null, 2), "utf-8");
}

/**
 * ファイル名の安全化
 * @param original
 * @returns
 */
function safeFileName(original: string) {
  // パストラバーサル対策：ファイル名だけ残す
  const base = path.basename(original);
  // 超ざっくり危険文字を除去（必要なら強化）
  return base.replace(/[^\w.\-()\[\] ]/g, "_");
}

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
