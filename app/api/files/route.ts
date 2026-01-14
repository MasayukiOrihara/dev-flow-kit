import { FileMeta } from "@/contents/types/file.type";
import { saveInputFile } from "@/lib/files/workspaceStorage.file";
import { readMeta, writeMeta } from "@/lib/files/meta.file";
import { notFound } from "@/lib/guard/error.guard";
import { FILE_NOT_FOUND } from "@/contents/messages/error.message";

// fsを使うのでNode runtime（blobでもOK）
export const runtime = "nodejs";

export async function POST(req: Request) {
  const form = await req.formData();
  const files = form.getAll("files");
  if (!files.length) return notFound(FILE_NOT_FOUND);

  const metaList = await readMeta();
  const saved: FileMeta[] = [];

  for (const item of files) {
    if (!(item instanceof File)) continue;
    const meta = await saveInputFile(item);
    metaList.unshift(meta);
    saved.push(meta);
  }

  // メタ情報の書き込み
  await writeMeta(metaList);

  return Response.json({ saved });
}

// メタ情報の取得
export async function GET() {
  const metaList = await readMeta();
  return Response.json({ files: metaList });
}
