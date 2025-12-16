import { INPUT_DIR } from "@/contents/parametars/file.parametar";
import { exportFile } from "@/lib/excel/exportFile";
import { Payload } from "@/lib/excel/exportSpecToExcel";
import { readMeta } from "@/lib/files/meta.file";
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
import {
  StringOutputParser,
  StructuredOutputParser,
} from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { UIMessage } from "ai";
import { readFileSync } from "fs";
import path from "node:path";
import fs from "node:fs/promises";
import { COMPONENT_ANALYZE_TEMPLATE } from "@/lib/template/class-template";

export const runtime = "nodejs";

export const SCENARIO_PATH = "public/markdowns/";
export const MARKDOWN_READ_API = "/api/markdown/read";

export const FILE_PATH = "public/files/";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    // コードの取得
    const codeText = body?.codeText;
    // ガード：必須 & 文字列
    if (typeof codeText !== "string" || codeText.trim() === "") {
      return Response.json(
        { error: "コードが取得できませんでした" },
        { status: 400 }
      );
    }

    // ファイル名の取得
    const fileName = body?.fileName;
    // ガード：必須 & 文字列
    if (typeof fileName !== "string" || fileName.trim() === "") {
      return Response.json(
        { error: "ファイル名が取得できませんでした" },
        { status: 400 }
      );
    }

    /* === === LLM === === */
    console.log("ファイル解析中...");
    // プロンプトの取得
    const template = COMPONENT_ANALYZE_TEMPLATE;

    // パサーを作成
    const parser = new StringOutputParser();

    const prompt = PromptTemplate.fromTemplate(template);
    const promptVariables = {
      fileName: fileName,
      code: codeText,
    };
    // LLM 応答
    const chain = prompt.pipe(OpenAi41).pipe(parser);
    const response = await chain.invoke(promptVariables);

    // todo: クラス仕様書エクセル出力

    console.log("ファイル解析完了 !");
    return Response.json(
      {
        text: response,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : UNKNOWN_ERROR;

    console.error(`${CHECK_ERROR}: ${message}`);
    return Response.json({ error: message }, { status: 500 });
  }
}
