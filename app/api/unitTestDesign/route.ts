import { exportFile } from "@/lib/excel/exportFile";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

import { TEST_DESIGN_DIR } from "@/contents/parametars/file.parametar";
import {
  TestCaseRow,
  TestCaseRowArraySchema,
} from "@/contents/schemas/testCase.schema";
import { OpenAi41 } from "@/contents/models/openai.model";
import * as ERR from "@/contents/messages/error.message";
import { Payload, TestType } from "@/contents/types/excel.type";
import { buildWorkbook } from "@/lib/excel/exportSpecToExcel";
import { loadTemplateById } from "../prompts/loadTemplateById/route";
import { reqObject, reqString } from "@/lib/guard/api.guard";

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
    const classDesign = reqObject<any>(
      body,
      "classDesign",
      ERR.EXCELFILE_ERROR
    );
    if (classDesign instanceof Response) return classDesign;
    // プロンプトテンプレートの取得
    const formatId = reqString(body, "formatId", ERR.TEMPLATE_ERROR);
    if (formatId instanceof Response) return formatId;

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
      classDesign: JSON.stringify(classDesign, null, 2),
      format_instructions: parser.getFormatInstructions(),
    };

    // LLM 応答
    const chain = prompt.pipe(OpenAi41).pipe(parser);
    const response: TestCaseRow[] = await chain.invoke(promptVariables);

    /* === === Excel ファイル === === */
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
    const message = error instanceof Error ? error.message : ERR.UNKNOWN_ERROR;

    console.error(`${ERR.CHECK_ERROR}: ${message}`);
    return Response.json({ error: message }, { status: 500 });
  }
}
