import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

function safeRelativePath(p: string) {
  // パストラバーサル対策（念のため）
  const normalized = p.replace(/\\/g, "/");
  if (normalized.includes("..")) throw new Error("invalid path");
  return normalized.replace(/^\/+/, "");
}

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const relativePathRaw = form.get("relativePath") as string | null;

  if (!file || !relativePathRaw) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  let relativePath: string;
  try {
    relativePath = safeRelativePath(relativePathRaw);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "invalid path" },
      { status: 400 },
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());

  const baseDir = path.join(process.cwd(), "workspace", "inputs");
  const destPath = path.join(baseDir, relativePath);

  await fs.mkdir(path.dirname(destPath), { recursive: true });
  await fs.writeFile(destPath, buf);

  return NextResponse.json({ ok: true, path: relativePath });
}
