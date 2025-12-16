import { CLASS_DESIGN_DIR } from "@/contents/parametars/file.parametar";
import { CHECK_ERROR, UNKNOWN_ERROR } from "@/lib/messages";
import { OpenAi41 } from "@/lib/models";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { loadTemplateById } from "@/app/api/prompts/loadTemplateById/route";

export const runtime = "nodejs";

/**
 * コードからクラス仕様書を出力する
 * @param req
 * @returns
 */
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
