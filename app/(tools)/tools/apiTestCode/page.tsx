"use client";

import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/api/postJson.api";
import { useState } from "react";
import { postSSEJson } from "@/lib/api/postSSEJson";
import {
  FILE_READ_ERROR,
  UNKNOWN_ERROR,
} from "@/contents/messages/error.message";
import {
  PRISMAFILE_READ_COMPLETE,
  RESULT_GENERATING,
} from "@/contents/messages/logger.message";
import { usePromptTemplates } from "@/components/hooks/page/usePromptTemplates";
import { useErrorMessage } from "@/components/hooks/page/useErrorMessage";
import { API_TEST_CODE_PK } from "@/contents/parametars/file.parametar";

export default function ApiTestCodePage() {
  const [prismaSchemaName, setPrismaSchemaName] = useState("");
  const [openApiName, setOpenApiName] = useState("");
  const [dbMapName, setDBMapName] = useState("");

  const [text, setText] = useState("");
  const { err, clearErr, handleError } = useErrorMessage(UNKNOWN_ERROR);

  const { templates, formatId, setFormatId } =
    usePromptTemplates(API_TEST_CODE_PK);
  const [isRunning, setIsRunning] = useState(false);

  /**
   * ファイルの読み込み
   * @returns
   */
  const load = async () => {
    if (isRunning) return;
    clearErr();
    setText("");
    setIsRunning(true);

    try {
      // 1) プリズマスキーマファイル読み込み
      const prismaSchemaRes = await postJson<{ text: string }>(
        "/api/files/textByName",
        { fileName: prismaSchemaName },
        FILE_READ_ERROR,
      );
      setText(PRISMAFILE_READ_COMPLETE);

      // 2) openAPIファイル読み込み
      const openApiFileRes = await postJson<{ text: string }>(
        "/api/files/textByName",
        { fileName: openApiName },
        FILE_READ_ERROR,
      );
      setText("OPEN API ファイルを読み込みました。");

      // 2) DB マップファイル読み込み
      const dbMapFileRes = await postJson<{ text: string }>(
        "/api/files/textByName",
        { fileName: dbMapName },
        FILE_READ_ERROR,
      );
      setText("DB Map ファイルを読み込みました");

      // 3) 結果生成
      setText(RESULT_GENERATING);
      setText("");

      const payload = {
        prismaSchema: prismaSchemaName,
        schemaCode: prismaSchemaRes.text,
        openApiName,
        openApiCode: openApiFileRes.text,
        dbMapName,
        dbMapCode: dbMapFileRes.text,
        formatId,
      };
      await postSSEJson("/api/apiTestCode", payload, (evt) => {
        if (evt.type === "text-delta" && typeof evt.delta === "string") {
          if (evt.delta) setText((prev) => prev + evt.delta);
        }
      });
    } catch (e) {
      handleError(e);
    } finally {
      setIsRunning(false);
    }
  };

  /**
   * テストコードをファイルで出力
   * @returns
   */
  const exportCode = async () => {
    if (isRunning) return;
    clearErr();
    setIsRunning(true);

    try {
      // 出力
      const res = await postJson<{ fileName: string }>(
        "/api/jestTestCode/exportTSCode",
        { llmText: text },
        FILE_READ_ERROR,
      );

      setText(`${res.fileName} を 出力しました`);
    } catch (e) {
      handleError(e);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div>
      <div>
        <h1 className="text-xl font-semibold">API テストコード生成</h1>
        <p className="text-muted-foreground">「API テストコード」を生成する</p>
      </div>
      <div>
        <h2>② APIテストコードを生成</h2>

        <div className="my-2">
          <h3 className="text-muted-foreground">
            生成元コードのファイル名と使用するプロンプトを指定してください
          </h3>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 my-2">
              <div>
                <p className="text-sm font-bold">schema.prisma</p>
                <input
                  className="border rounded px-2 py-1"
                  value={prismaSchemaName}
                  onChange={(e) => setPrismaSchemaName(e.target.value)}
                />
              </div>

              <div>
                <p className="text-sm font-bold">open APIコード</p>
                <input
                  className="border rounded px-2 py-1"
                  value={openApiName}
                  onChange={(e) => setOpenApiName(e.target.value)}
                />
              </div>

              <div>
                <p className="text-sm font-bold">DB mapコード</p>
                <input
                  className="border rounded px-2 py-1"
                  value={dbMapName}
                  onChange={(e) => setDBMapName(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-end gap-2 my-2">
              <div>
                <p className="text-sm font-bold">プロンプトテンプレート</p>
                <select
                  className="border rounded px-2 py-1"
                  value={formatId}
                  onChange={(e) => setFormatId(e.target.value)}
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id} disabled={!t.enabled}>
                      {t.label}
                      {!t.enabled ? "（準備中）" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                onClick={load}
                disabled={isRunning}
                className="bg-blue-400 hover:bg-blue-600 ml-8"
              >
                {isRunning ? "処理中..." : "読み込み→生成"}
              </Button>

              {text.length > 0 ? (
                <Button
                  variant="outline"
                  onClick={exportCode}
                  disabled={isRunning}
                  className="hover:bg-blue-600 ml-2"
                >
                  {isRunning ? "処理中..." : "結果ファイル出力"}
                </Button>
              ) : null}
            </div>

            {err ? (
              <p className="text-red-400 font-bold text-sm">{err}</p>
            ) : null}
          </div>

          <h3 className="text-muted-foreground">解析結果</h3>
          <pre className="border rounded p-3 overflow-auto whitespace-pre-wrap">
            {text}
          </pre>
        </div>
      </div>
    </div>
  );
}
