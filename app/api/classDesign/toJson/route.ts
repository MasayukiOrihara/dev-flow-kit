import {
  CLASS_DESIGN_DIR,
  OUTPUT_DIR,
} from "@/contents/parametars/file.parametar";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
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
import { JSON_MINE } from "@/contents/messages/mine.message";
import { SaveClassResultJson } from "@/contents/types/parts.type";

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

    // json ファイル保存
    const save = await saveControllerSummary(response, fileName);

    console.log("ファイル解析完了 !");
    if (!save.ok) {
      return Response.json(save, { status: 400 });
    }
    return Response.json(save, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : ERR.UNKNOWN_ERROR;

    console.error(`${ERR.CHECK_ERROR}: ${message}`);
    return Response.json({ error: message }, { status: 500 });
  }
}

async function saveControllerSummary(
  json: ControllerSummary,
  fileName: string,
): Promise<SaveClassResultJson> {
  // 1. Zodで検証（ここが超重要）
  const result = ControllerSummarySchema.safeParse(json);

  if (!result.success) {
    return {
      ok: false,
      errorType: "VALIDATION_ERROR",
      message: "Schema validation failed",
      issues: result.error.issues,
    };
  }

  try {
    // 2. 出力先パス
    // 念のためファイル名を安全化（パストラバーサル対策）
    const fileNameJson = "controller-summary";

    // ファイル名の加工
    const baseName = fileName.replace(/\.controller\.ts$/, "");

    const id = crypto.randomUUID();
    const nameId = id.replace(/-/g, "").slice(0, 12);
    const outputFileName = `${baseName}_${fileNameJson}_${nameId}.json`;

    const safeFileName = path.basename(outputFileName);
    const filePath = path.join(OUTPUT_DIR, safeFileName);

    const json = JSON.stringify(result.data, null, 2);

    // 3. ディレクトリ作成（なければ）
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    // 4. JSONファイル書き込み（整形付き）
    await fs.writeFile(filePath, json, "utf8");

    // 5. メタデータ書き込み
    const metaList = await readMeta();

    const buf = new TextEncoder().encode(json);

    const meta: FileMeta = {
      id,
      name: safeFileName,
      size: buf.length,
      mime: JSON_MINE,
      savedPath: filePath,
      uploadedAt: new Date().toISOString(),
    };

    metaList.unshift(meta);
    await writeMeta(metaList); // 書き込み
    return {
      ok: true,
      savedPath: filePath,
      metaId: id,
      json: json,
    };
  } catch (err) {
    return {
      ok: false,
      errorType: "WRITE_ERROR",
      message: err instanceof Error ? err.message : String(err),
    };
  }
}
