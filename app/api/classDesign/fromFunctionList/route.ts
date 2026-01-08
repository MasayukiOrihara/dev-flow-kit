import { CLASS_DESIGN_DIR } from "@/contents/parametars/file.parametar";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { OpenAi41 } from "@/contents/models/openai.model";
import * as ERR from "@/contents/messages/error.message";
import { reqObject, reqString } from "@/lib/guard/api.guard";
import { loadTemplateById } from "@/lib/files/loadTemplateById.file";

export const runtime = "nodejs";

/**
 * 機能一覧表からクラス仕様書を出力する
 * @param req
 * @returns
 */
export async function POST(req: Request) {
  try {
    const body: unknown = await req.json().catch(() => ({}));

    /* === === ガード === === */
    // エクセルの取得
    const excelJson = reqObject(body, "excelJson", ERR.EXCELFILE_ERROR);
    if (excelJson instanceof Response) return excelJson;
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
    const parser = new StringOutputParser();

    const prompt = PromptTemplate.fromTemplate(template);
    const promptVariables = {
      fileName: fileName,
      code: JSON.stringify(excelJson, null, 2),
    };
    // LLM 応答
    const chain = prompt.pipe(OpenAi41).pipe(parser);
    const response = await chain.invoke(promptVariables);

    // todo: クラス仕様書エクセル出力

    console.log("ファイル解析完了 !");
    return Response.json({ text: response }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : ERR.UNKNOWN_ERROR;

    console.error(`${ERR.CHECK_ERROR}: ${message}`);
    return Response.json({ error: message }, { status: 500 });
  }
}
