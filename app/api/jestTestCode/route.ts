import * as ERR from "@/contents/messages/error.message";
import { OpenAi41 } from "@/contents/models/openai.model";
import { reqFlag, reqObject, reqString } from "@/lib/guard/api.guard";
import { toUIMessageStream } from "@ai-sdk/langchain";
import { PromptTemplate } from "@langchain/core/prompts";
import { createUIMessageStreamResponse } from "ai";
import { TEST_CODE_DIR } from "@/contents/parametars/file.parametar";
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
    const fileName = reqString(body, "fileName", ERR.FILENAME_ERROR);
    if (fileName instanceof Response) return fileName;
    // コードの取得
    const codeText = reqString(body, "codeText", ERR.CODETEXT_ERROR);
    if (codeText instanceof Response) return codeText;
    // 単体テスト仕様書の取得
    const isJsonOrRes = reqFlag(body, "isJson", ERR.FLAG_ERROR);
    if (isJsonOrRes instanceof Response) return isJsonOrRes;

    let testDesign: string;
    if (isJsonOrRes) {
      // JSON の場合
      const testDesignJson = reqString(body, "codeText", ERR.CODETEXT_ERROR);
      if (testDesignJson instanceof Response) return testDesignJson;
      testDesign = testDesignJson;
    } else {
      // EXCEL の場合
      const testDesignExcel = reqObject(
        body,
        "testDesign",
        ERR.EXCELFILE_ERROR,
      );
      if (testDesignExcel instanceof Response) return testDesignExcel;
      testDesign = JSON.stringify(testDesignExcel, null, 2);
    }
    // プロンプトテンプレートの取得
    const formatId = reqString(body, "formatId", ERR.TEMPLATE_ERROR);
    if (formatId instanceof Response) return formatId;

    /* === === LLM === === */
    console.log("ファイル解析中...");
    // プロンプトの取得
    const template = await loadTemplateById(formatId, TEST_CODE_DIR);

    const prompt = PromptTemplate.fromTemplate(template);
    const promptVariables = {
      fileName: fileName,
      code: codeText,
      testDesign: testDesign,
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
