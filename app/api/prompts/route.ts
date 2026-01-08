import { TEMPLATE_INDEX } from "@/contents/parametars/file.parametar";
import { TemplateItem } from "@/contents/types/prompt.type";
import { driver } from "@/lib/files/pathResolver.file";
import { isTemplateItem } from "@/lib/guard/prompt.guard";
import { list } from "@vercel/blob";
import fs from "node:fs/promises";

export const runtime = "nodejs";

/**
 * プロンプトテンプレートの一覧を取得
 * @param req
 * @returns
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind"); // "classDesign" など

  // 取得
  const list = await readTemplateIndex();

  const filtered = kind ? list.filter((x) => x.kind === kind) : list;
  return Response.json({ templates: filtered });
}

async function readTemplateIndex(): Promise<TemplateItem[]> {
  // local
  if (driver() === "local") {
    try {
      const s = await fs.readFile(TEMPLATE_INDEX, "utf-8");
      const parsed: unknown = JSON.parse(s);
      return Array.isArray(parsed) ? parsed.filter(isTemplateItem) : [];
    } catch {
      return [];
    }
  }

  // blob
  try {
    const { blobs } = await list({ prefix: TEMPLATE_INDEX, limit: 1 });
    const b = blobs.find((x) => x.pathname === TEMPLATE_INDEX);
    if (!b) return [];

    const res = await fetch(b.url);
    if (!res.ok) return [];

    const parsed: unknown = await res.json().catch(() => []);
    return Array.isArray(parsed) ? parsed.filter(isTemplateItem) : [];
  } catch {
    return [];
  }
}
