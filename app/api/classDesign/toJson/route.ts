import {
  CLASS_DESIGN_DIR,
  OUTPUT_DIR,
} from "@/contents/parametars/file.parametar";
import {
  StringOutputParser,
  StructuredOutputParser,
} from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { OpenAi41 } from "@/contents/models/openai.model";
import * as ERR from "@/contents/messages/error.message";
import { reqString } from "@/lib/guard/api.guard";
import { loadTemplateById } from "@/lib/files/loadTemplateById.file";
import {
  ControllerSummary,
  ControllerSummarySchema,
} from "@/contents/schemas/class/controller.class.schema";

import fs from "node:fs/promises";
import path from "node:path";
import { readMeta, writeMeta } from "@/lib/files/meta.file";
import { FileMeta } from "@/contents/types/file.type";
import { DEFAULT_MINE, JSON_MINE } from "@/contents/messages/mine.message";

export const runtime = "nodejs";

/**
 * コードからクラス仕様書(JSON形式)を出力する
 * @param req
 * @returns
 */
export async function POST(req: Request) {
  try {
    const body: unknown = await req.json().catch(() => ({}));

    /* === === ガード === === */
    // コードの取得
    const codeText = reqString(body, "codeText", ERR.CODETEXT_ERROR);
    if (codeText instanceof Response) return codeText;
    // ファイル名の取得
    const fileName = reqString(body, "fileName", ERR.FILENAME_ERROR);
    if (fileName instanceof Response) return fileName;
    // プロンプトテンプレートの取得
    const formatId = reqString(body, "formatId", ERR.TEMPLATE_ERROR);
    if (formatId instanceof Response) return formatId;

    /* === === LLM === === */
    console.log("ファイル解析中...");
    // プロンプトの取得
    const template = await loadTemplateById(formatId, CLASS_DESIGN_DIR);

    // パサーを作成
    const parser = StructuredOutputParser.fromZodSchema(
      ControllerSummarySchema,
    );

    const prompt = PromptTemplate.fromTemplate(template);
    const promptVariables = {
      fileName: fileName,
      code: codeText,
      format_instructions: parser.getFormatInstructions(),
    };
    // LLM 応答
    const chain = prompt.pipe(OpenAi41).pipe(parser);
    const response: ControllerSummary = await chain.invoke(promptVariables);

    console.log("🐶");

    // json ファイル保存
    await saveControllerSummary(response, fileName);

    console.log("ファイル解析完了 !");
    return Response.json({ text: response }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : ERR.UNKNOWN_ERROR;

    console.error(`${ERR.CHECK_ERROR}: ${message}`);
    return Response.json({ error: message }, { status: 500 });
  }
}

async function saveControllerSummary(
  json: ControllerSummary,
  fileName: string,
) {
  // 1. Zodで検証（ここが超重要）
  const result = ControllerSummarySchema.safeParse(json);

  if (!result.success) {
    console.error("❌ Schema validation failed");
    console.error(result.error.message);
    throw new Error("Invalid ControllerSummary JSON");
  }

  // 2. 出力先パス
  // 念のためファイル名を安全化（パストラバーサル対策）
  const fileNameJson = "_controller-summary.json";
  const safeFileName = path.basename(fileName);
  const outputPath = path.join(OUTPUT_DIR, safeFileName + fileNameJson);

  // 3. ディレクトリ作成（なければ）
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // 4. JSONファイル書き込み（整形付き）
  await fs.writeFile(outputPath, JSON.stringify(result.data, null, 2), "utf8");

  // 5. メタデータ書き込み
  const metaList = await readMeta();

  const id = crypto.randomUUID();
  const buf = new TextEncoder().encode(JSON.stringify(result.data, null, 2));

  const meta: FileMeta = {
    id,
    name: safeFileName,
    size: buf.length,
    mime: JSON_MINE,
    savedPath: outputPath,
    uploadedAt: new Date().toISOString(),
  };

  metaList.unshift(meta);
  await writeMeta(metaList); // 書き込み

  console.log(`✅ JSON saved to ${outputPath}`);
}
