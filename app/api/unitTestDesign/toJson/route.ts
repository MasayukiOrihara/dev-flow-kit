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
import { reqObject, reqString } from "@/lib/guard/api.guard";
import { loadTemplateById } from "@/lib/files/loadTemplateById.file";
import { SaveJsonResult } from "@/contents/types/parts.type";
import { saveJsonArtifact } from "@/lib/files/saveJsonArtifact.file";

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
    // クラス仕様書の取得
    const classDesign = reqString(body, "classDesign", ERR.JSONFILE_ERROR);
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

    // json ファイル保存
    const save = await saveUnitTestDesign(response, fileName);

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

async function saveUnitTestDesign(
  data: unknown,
  fileName: string,
): Promise<SaveJsonResult> {
  return saveJsonArtifact({
    data,
    schema: TestCaseRowArraySchema,
    sourceFileName: fileName,
    artifactKey: "unit-test-design",
    buildBaseName: (n) => n.replace(/\.controller\.ts$/, ""),
  });
}
