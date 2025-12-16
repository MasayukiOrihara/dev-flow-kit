import { exportFile } from "@/lib/excel/exportFile";
import { Payload } from "@/lib/excel/exportSpecToExcel";
import { CHECK_ERROR, UNKNOWN_ERROR, URL_ERROR } from "@/lib/messages";
import { OpenAi41 } from "@/lib/models";
import {
  ComprehensiveTestCaseRow,
  ComprehensiveTestCaseRowArraySchema,
  ComprehensiveTestCaseRowSchema,
  TestCaseRow,
  TestCaseRowArraySchema,
} from "@/lib/schema";
import {
  COMPREHENSIVE_TEST_OUTPUT_EMPLATE,
  TEST_ANALYZE_OUTPUT_TEMPLATE,
} from "@/lib/template/test-template";
import { messageText } from "@/lib/utils";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { UIMessage } from "ai";
import { readFileSync } from "fs";

export const SCENARIO_PATH = "public/markdowns/";
export const MARKDOWN_READ_API = "/api/markdown/read";

export const FILE_PATH = "public/files/";

export async function POST(req: Request) {
  try {
    // チャットデータの取得
    const body = await req.json();
    // フロントから今までのメッセージを取得
    const messages: UIMessage[] = body.messages ?? [];

    // urlの取得
    const url = new URL(req.url);
    if (!url) {
      throw new Error(URL_ERROR);
    }

    //現在の履歴 {input}用
    const currentMessage = messages[messages.length - 1];
    const file = messageText(currentMessage);

    // 問題内容の取得
    const dir = FILE_PATH;
    const text = readFileSync(`${dir}${file}`, "utf8");

    // テキストの取得(一時)
    //const srsName = "srs.ts";
    //const srsText = readFileSync(`${dir}${srsName}`, "utf8");
    //const screenName = "screen_user.json";
    //const screenText = readFileSync(`${dir}${screenName}`, "utf8");

    /* === === LLM === === */
    console.log("ファイル解析中...");
    // プロンプトの取得
    const template = TEST_ANALYZE_OUTPUT_TEMPLATE;
    // const template = COMPREHENSIVE_TEST_OUTPUT_EMPLATE;

    // パサーを作成
    const parser = StructuredOutputParser.fromZodSchema(TestCaseRowArraySchema);
    // const parser = StructuredOutputParser.fromZodSchema(
    //   ComprehensiveTestCaseRowArraySchema
    // );

    const prompt = PromptTemplate.fromTemplate(template);
    const promptVariables = {
      fileName: file,
      code: text,
      // functionFileName: file,
      // functionJson: text,
      // srsFileName: srsName,
      // srs: srsText,
      // screenFileName: screenName,
      // screenJson: screenText,
      format_instructions: parser.getFormatInstructions(),
    };
    // LLM 応答
    const chain = prompt.pipe(OpenAi41).pipe(parser);
    const response: TestCaseRow[] = await chain.invoke(promptVariables);
    // const response: ComprehensiveTestCaseRow[] = await chain.invoke(
    //   promptVariables
    // );

    // Excel ファイル出力
    const payload: Payload = { fileName: file, cases: response };
    await exportFile(payload);

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
