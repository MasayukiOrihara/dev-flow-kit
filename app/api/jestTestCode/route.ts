import * as ERR from "@/contents/messages/error.message";
import { OpenAi41 } from "@/contents/models/openai.model";
import { TestCaseRowArraySchema } from "@/contents/schemas/testCase.schema";
import { reqObject, reqString } from "@/lib/guard/api.guard";
import { toUIMessageStream } from "@ai-sdk/langchain";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { createUIMessageStreamResponse } from "ai";
import { loadTemplateById } from "../prompts/loadTemplateById/route";
import { TEST_CODE_DIR } from "@/contents/parametars/file.parametar";

/**
 * テストコードを生成する
 * @param req
 * @returns
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));

    /* === === ガード === === */
    // ファイル名の取得
    const fileName = reqString(body, "fileName", ERR.FILENAME_ERROR);
    if (fileName instanceof Response) return fileName;
    // コードの取得
    const codeText = reqString(body, "codeText", ERR.CODETEXT_ERROR);
    if (codeText instanceof Response) return codeText;
    // excelファイルの取得
    const testDesign = reqObject<any>(body, "testDesign", ERR.EXCELFILE_ERROR);
    if (testDesign instanceof Response) return testDesign;
    // プロンプトテンプレートの取得
    const formatId = reqString(body, "formatId", ERR.TEMPLATE_ERROR);
    if (formatId instanceof Response) return formatId;

    console.log(JSON.stringify(testDesign, null, 2));

    /* === === LLM === === */
    console.log("ファイル解析中...");
    // プロンプトの取得
    const template = await loadTemplateById(formatId, TEST_CODE_DIR);

    const prompt = PromptTemplate.fromTemplate(template);
    const promptVariables = {
      fileName: fileName,
      code: codeText,
      testDesign: JSON.stringify(testDesign, null, 2),
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
