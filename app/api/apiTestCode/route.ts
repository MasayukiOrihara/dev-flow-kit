import * as ERR from "@/contents/messages/error.message";
import { OpenAi41 } from "@/contents/models/openai.model";
import { reqString } from "@/lib/guard/api.guard";
import { toUIMessageStream } from "@ai-sdk/langchain";
import { PromptTemplate } from "@langchain/core/prompts";
import { createUIMessageStreamResponse } from "ai";
import { API_TEST_CODE_DIR } from "@/contents/parametars/file.parametar";
import { loadTemplateById } from "@/lib/files/loadTemplateById.file";

/**
 * テストコードを生成する
 * @param req
 * @returns
 */
export async function POST(req: Request) {
  try {
    const body: unknown = await req.json().catch(() => ({}));

    /* === === ガード === === */
    // ファイル名の取得
    const prismaSchema = reqString(body, "prismaSchema", ERR.FILENAME_ERROR);
    if (prismaSchema instanceof Response) return prismaSchema;
    // コードの取得
    const schemaCode = reqString(body, "schemaCode", ERR.CODETEXT_ERROR);
    if (schemaCode instanceof Response) return schemaCode;

    // ファイル名の取得
    const openApiName = reqString(body, "openApiName", ERR.FILENAME_ERROR);
    if (openApiName instanceof Response) return openApiName;
    // コードの取得
    const openApiCode = reqString(body, "openApiCode", ERR.CODETEXT_ERROR);
    if (openApiCode instanceof Response) return openApiCode;

    // ファイル名の取得
    const dbMapName = reqString(body, "dbMapName", ERR.FILENAME_ERROR);
    if (dbMapName instanceof Response) return dbMapName;
    // コードの取得
    const dbMapCode = reqString(body, "dbMapCode", ERR.CODETEXT_ERROR);
    if (dbMapCode instanceof Response) return dbMapCode;

    // プロンプトテンプレートの取得
    const formatId = reqString(body, "formatId", ERR.TEMPLATE_ERROR);
    if (formatId instanceof Response) return formatId;

    /* === === LLM === === */
    console.log("ファイル解析中...");
    // プロンプトの取得
    const template = await loadTemplateById(formatId, API_TEST_CODE_DIR);

    const prompt = PromptTemplate.fromTemplate(template);
    const promptVariables = {
      prismaSchema,
      schemaCode,
      openApiName,
      openApiCode,
      dbMapName,
      dbMapCode,
    };
    // LLM 応答
    const chain = prompt.pipe(OpenAi41);
    const lcStream = await chain.stream(promptVariables);

    const response = createUIMessageStreamResponse({
      stream: toUIMessageStream(lcStream),
    });
    console.log("ファイル解析完了 !");

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : ERR.UNKNOWN_ERROR;

    console.error(`${ERR.CHECK_ERROR}: ${message}`);
    return Response.json({ error: message }, { status: 500 });
  }
}
