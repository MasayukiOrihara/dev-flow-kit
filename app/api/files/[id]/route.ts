import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const INPUT_DIR = process.env.INPUT_DIR ?? "./inputs";
const META_DIR = process.env.META_DIR ?? "./workspace/meta";
const META_FILE = path.join(META_DIR, "files.json");

type FileMeta = {
  id: string;
  name: string;
  size: number;
  mime: string;
  savedPath: string;
  uploadedAt: string;
};

async function ensureDirs() {
  await fs.mkdir(INPUT_DIR, { recursive: true });
  await fs.mkdir(META_DIR, { recursive: true });
}

async function readMeta(): Promise<FileMeta[]> {
  try {
    const s = await fs.readFile(META_FILE, "utf-8");
    return JSON.parse(s) as FileMeta[];
  } catch {
    return [];
  }
}

async function writeMeta(list: FileMeta[]) {
  await fs.writeFile(META_FILE, JSON.stringify(list, null, 2), "utf-8");
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const list = await readMeta();
  const meta = list.find((m) => m.id === id);

  if (!meta) {
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
