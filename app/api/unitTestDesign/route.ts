import { exportFile } from "@/lib/excel/exportFile";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

import { TEST_DESIGN_DIR } from "@/contents/parametars/file.parametar";
import {
  TestCaseRow,
  TestCaseRowArraySchema,
} from "@/contents/schemas/testCase.schema";
import { OpenAi41 } from "@/contents/models/openai.model";
import { CHECK_ERROR, UNKNOWN_ERROR } from "@/contents/messages/error.message";
import { Payload, TestType } from "@/contents/types/excel.type";
import { buildWorkbook } from "@/lib/excel/exportSpecToExcel";
import { loadTemplateById } from "../prompts/loadTemplateById/route";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));

    // ファイル名の取得
    const fileName = body?.fileName;
    // ガード：必須 & 文字列
    if (typeof fileName !== "string" || fileName.trim() === "") {
      return Response.json(
        { error: "ファイル名が取得できませんでした" },
        { status: 400 }
      );
    }

    // コードの取得
    const codeText = body?.codeText;
    // ガード：必須 & 文字列
    if (typeof codeText !== "string" || codeText.trim() === "") {
      return Response.json(
        { error: "コードが取得できませんでした" },
        { status: 400 }
      );
    }

    // excelファイルの取得
    const testDesign = body?.testDesign;
    // ガード：必須 & オブジェクト
    if (
      !testDesign ||
      typeof testDesign !== "object" ||
      Array.isArray(testDesign)
    ) {
      return Response.json(
        { error: "テスト設計（Excel）が取得できませんでした" },
        { status: 400 }
      );
    }

    // プロンプトテンプレートの取得
    const formatId = body?.formatId;
    if (typeof formatId !== "string" || formatId.trim() === "") {
      return Response.json(
        { error: "テンプレートが選択されていません" },
        { status: 400 }
      );
    }

    /* === === LLM === === */
    console.log("ファイル解析中...");
    // プロンプトの取得
    const template = await loadTemplateById(formatId, TEST_DESIGN_DIR);

    // パサーを作成
    const parser = StructuredOutputParser.fromZodSchema(TestCaseRowArraySchema);

    const prompt = PromptTemplate.fromTemplate(template);
    const promptVariables = {
      fileName: fileName,
      code: codeText,
      testDesign: testDesign,
      format_instructions: parser.getFormatInstructions(),
    };

    // LLM 応答
    const chain = prompt.pipe(OpenAi41).pipe(parser);
    const response: TestCaseRow[] = await chain.invoke(promptVariables);

    // Excel ファイル作成
    const payload: Payload = { fileName: fileName, cases: response };
    const type: TestType = "unit";
    const wb = await buildWorkbook(payload, type);

    // 出力
    await exportFile(wb, fileName);

    console.log("ファイル解析完了 !");
    return Response.json(
      {
        message: "ファイル解析完了しました。Excelファイルを確認してください。",
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : UNKNOWN_ERROR;

    console.error(`${CHECK_ERROR}: ${message}`);
    return Response.json({ error: message }, { status: 500 });
  }
}
