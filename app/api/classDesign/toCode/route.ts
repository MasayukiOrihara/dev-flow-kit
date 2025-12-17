import { CLASS_DESIGN_DIR } from "@/contents/parametars/file.parametar";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { loadTemplateById } from "@/app/api/prompts/loadTemplateById/route";
import { OpenAi41 } from "@/contents/models/openai.model";
import * as ERR from "@/contents/messages/error.message";
import { reqString } from "@/lib/guard/api.guard";

export const runtime = "nodejs";

/**
 * コードからクラス仕様書を出力する
 * @param req
 * @returns
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));

    /* === === ガード === === */
    // コードの取得
    const codeText = reqString(body, "codeText", ERR.CODETEXT_ERROR);
    if (codeText instanceof Response) return codeText;
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
      code: codeText,
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
