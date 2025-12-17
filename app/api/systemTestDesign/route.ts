import * as ERR from "@/contents/messages/error.message";
import { OpenAi41 } from "@/contents/models/openai.model";
import {
  ComprehensiveTestCaseRow,
  ComprehensiveTestCaseRowArraySchema,
} from "@/contents/schemas/testCase.schema";
import { exportFile } from "@/lib/excel/exportFile";
import { reqObject, reqString } from "@/lib/guard/api.guard";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { loadTemplateById } from "../prompts/loadTemplateById/route";
import { TEST_DESIGN_DIR } from "@/contents/parametars/file.parametar";
import { Payload, TestType } from "@/contents/types/excel.type";
import { buildWorkbook } from "@/lib/excel/exportSpecToExcel";

const SYSTEM_TEST_NAME = "system-test";

/**
 * 総合テスト仕様書生成
 * @param req
 * @returns
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));

    /* === === ガード === === */
    // 機能一覧表(excel)の取得
    const functionFile = reqObject<any>(
      body,
      "functionFile",
      ERR.EXCELFILE_ERROR
    );
    if (functionFile instanceof Response) return functionFile;
    // 要求仕様書（TEXT）の取得
    const srsText = reqString(body, "srsText", ERR.CODETEXT_ERROR);
    if (srsText instanceof Response) return srsText;
    // 画面一覧表(excel)の取得
    const screenFile = reqObject<any>(body, "screenFile", ERR.EXCELFILE_ERROR);
    if (screenFile instanceof Response) return screenFile;
    // プロンプトテンプレートの取得
    const formatId = reqString(body, "formatId", ERR.TEMPLATE_ERROR);
    if (formatId instanceof Response) return formatId;

    /* === === LLM === === */
    console.log("ファイル解析中...");
    // プロンプトの取得
    const template = await loadTemplateById(formatId, TEST_DESIGN_DIR);

    // パサーを作成
    const parser = StructuredOutputParser.fromZodSchema(
      ComprehensiveTestCaseRowArraySchema
    );

    const prompt = PromptTemplate.fromTemplate(template);
    const promptVariables = {
      functionJson: JSON.stringify(functionFile, null, 2),
      srs: srsText,
      screenJson: JSON.stringify(screenFile, null, 2),
      format_instructions: parser.getFormatInstructions(),
    };
    // LLM 応答
    const chain = prompt.pipe(OpenAi41).pipe(parser);
    const response: ComprehensiveTestCaseRow[] = await chain.invoke(
      promptVariables
    );

    /* === === Excel ファイル === === */
    const payload: Payload = { fileName: SYSTEM_TEST_NAME, cases: response };
    const type: TestType = "system";
    const wb = await buildWorkbook(payload, type);

    // 出力
    await exportFile(wb, SYSTEM_TEST_NAME);

    console.log("ファイル解析完了 !");
    return Response.json(
      {
        message: "ファイル解析完了しました。Excelファイルを確認してください。",
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : ERR.UNKNOWN_ERROR;

    console.error(`${ERR.CHECK_ERROR}: ${message}`);
    return Response.json({ error: message }, { status: 500 });
  }
}
