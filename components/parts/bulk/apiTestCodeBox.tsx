"use client";

import { useErrorMessage } from "@/components/hooks/page/useErrorMessage";
import { useFileNames } from "@/components/hooks/page/useFileNames";
import { usePromptTemplates } from "@/components/hooks/page/usePromptTemplates";
import { Button } from "@/components/ui/button";
import { FILE_READ_ERROR } from "@/contents/messages/error.message";
import {
  PRISMAFILE_READ_COMPLETE,
  RESULT_GENERATING,
} from "@/contents/messages/logger.message";
import { API_TEST_CODE_PK } from "@/contents/parametars/file.parametar";
import { postJson } from "@/lib/api/postJson.api";
import { postSSEJson } from "@/lib/api/postSSEJson";
import { useMemo, useState } from "react";

export function ApiTestCodeBox() {
  const { files, setFile, isReady, resetFiles } = useFileNames();
  const [isRunning, setIsRunning] = useState(false);
  const { templates, formatId, setFormatId } = usePromptTemplates(
    encodeURIComponent(API_TEST_CODE_PK),
  );

  const [statusText, setStatusText] = useState("");
  const [resultText, setResultText] = useState("");
  const { err, clearErr, run: runSafe } = useErrorMessage("処理に失敗しました");

  // 動作チェック
  const canRun = useMemo(() => {
    if (isRunning) return false;
    if (!isReady) return false;
    if (!formatId) return false;
    return true;
  }, [isReady, formatId, isRunning]);

  // 生成関数
  const runGenerateDesign = async ({ formatId }: { formatId: string }) => {
    // 1) プリズマスキーマファイル読み込み
    const prismaSchemaRes = await postJson<{ text: string }>(
      "/api/files/textByName",
      { fileName: files.prismaSchema },
      FILE_READ_ERROR,
    );
    setStatusText(PRISMAFILE_READ_COMPLETE);

    // 2) openAPIファイル読み込み
    const openApiFileRes = await postJson<{ text: string }>(
      "/api/files/textByName",
      { fileName: files.openAPI },
      FILE_READ_ERROR,
    );
    setStatusText("OPEN API ファイルを読み込みました。");

    // 2) DB マップファイル読み込み
    const dbMapFileRes = await postJson<{ text: string }>(
      "/api/files/textByName",
      { fileName: files.dbMap },
      FILE_READ_ERROR,
    );
    setStatusText("DB Map ファイルを読み込みました");

    // 3) 結果生成
    setStatusText(RESULT_GENERATING);

    const payload = {
      prismaSchema: files.prismaSchema,
      schemaCode: prismaSchemaRes.text,
      openApiName: files.openAPI,
      openApiCode: openApiFileRes.text,
      dbMapName: files.dbMap,
      dbMapCode: dbMapFileRes.text,
      formatId,
    };
    await postSSEJson("/api/apiTestCode", payload, (evt) => {
      if (evt.type === "text-delta" && typeof evt.delta === "string") {
        if (evt.delta) setResultText((prev) => prev + evt.delta);
      }
    });
  };

  /**
   * ファイルの読み込み
   * @returns
   */
  const onRun = async () => {
    if (!canRun) return;

    clearErr();
    setIsRunning(true);

    try {
      const resultText = await runSafe(() =>
        runGenerateDesign({
          formatId,
        }),
      );
      setResultText(resultText ?? "");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-full px-1 shadow-sm overflow-hidden">
      <h2 className="p-1">APIテストコード生成</h2>

      <div className="flex flex-col gap-2">
        <div>
          <h3>Prismaスキーマ</h3>
          <input
            className="border rounded px-2 py-1"
            value={files.prismaSchema}
            placeholder="ファイル名を入力"
            onChange={(e) => setFile("prismaSchema", e.target.value)}
          />
        </div>

        <div>
          <h3>openAPI</h3>
          <input
            className="border rounded px-2 py-1"
            value={files.controller}
            placeholder="ファイル名を入力"
            onChange={(e) => setFile("controller", e.target.value)}
          />
        </div>

        <div>
          <h3>DB マッピング定義</h3>
          <input
            className="border rounded px-2 py-1"
            value={files.service}
            placeholder="ファイル名を入力"
            onChange={(e) => setFile("service", e.target.value)}
          />
        </div>

        <div>
          <h3>プロンプト設定</h3>
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
          onClick={onRun}
          disabled={!canRun}
          className="bg-blue-400 hover:bg-blue-600"
        >
          {isRunning ? "処理中..." : "読み込み→生成"}
        </Button>

        {err ? (
          <p className="text-red-400 font-bold text-sm mt-2">{err}</p>
        ) : null}
      </div>

      <div className="flex flex-col overflow-hidden">
        <h3>出力結果</h3>
        <div className="overflow-y-auto scrollbar-hidden">
          {resultText ? (
            <>
              <h3 className="text-muted-foreground mt-3">解析結果</h3>
              <pre className="border rounded p-3 overflow-auto whitespace-pre-wrap scrollbar-hidden">
                {resultText}
              </pre>
            </>
          ) : null}
        </div>
        <div>
          <p>json で出力</p>
          <span>Excel で出力</span>
        </div>
      </div>
    </div>
  );
}
