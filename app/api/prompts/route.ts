import { TEMPLATE_INDEX } from "@/contents/parametars/file.parametar";
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

  let list: any[] = [];
  try {
    const s = await fs.readFile(TEMPLATE_INDEX, "utf-8");
    list = JSON.parse(s);
  } catch {
    list = [];
  }

  const filtered = kind ? list.filter((x) => x.kind === kind) : list;
  return Response.json({ templates: filtered });
}
