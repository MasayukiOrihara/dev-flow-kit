"use client";

import { useErrorMessage } from "@/components/hooks/page/useErrorMessage";
import { useFileNames } from "@/components/hooks/page/useFileNames";
import { usePromptTemplates } from "@/components/hooks/page/usePromptTemplates";
import { Button } from "@/components/ui/button";
import { FILE_READ_ERROR } from "@/contents/messages/error.message";
import {
  CONTROLLERFILE_READ_COMPLETE,
  PRISMAFILE_READ_COMPLETE,
  RESULT_GENERATING,
  SERVICEFILE_READ_COMPLETE,
} from "@/contents/messages/logger.message";
import { DB_MAPPING_PK } from "@/contents/parametars/file.parametar";
import { postJson } from "@/lib/api/postJson.api";
import { postSSEJson } from "@/lib/api/postSSEJson";
import { useMemo, useState } from "react";

type ApiTestCodeFileType = "prismaSchema" | "controller" | "service" | "dbMap";

export function DBMappingBox() {
  const { files, setFile, isReady, resetFiles } =
    useFileNames<ApiTestCodeFileType>();
  const [isRunning, setIsRunning] = useState(false);
  const { templates, formatId, setFormatId } = usePromptTemplates(
    encodeURIComponent(DB_MAPPING_PK),
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

    // 2) コントローラーコードファイル読み込み
    const controllerFileRes = await postJson<{ text: string }>(
      "/api/files/textByName",
      { fileName: files.controller },
      FILE_READ_ERROR,
    );
    setStatusText(CONTROLLERFILE_READ_COMPLETE);

    // 2) サービスファイル読み込み
    const serviceFileRes = await postJson<{ text: string }>(
      "/api/files/textByName",
      { fileName: files.service },
      FILE_READ_ERROR,
    );
    setStatusText(SERVICEFILE_READ_COMPLETE);

    // 3) 結果生成
    setStatusText(RESULT_GENERATING);

    const payload = {
      prismaSchema: files.prismaSchema,
      schemaCode: prismaSchemaRes.text,
      controllerName: files.controller,
      controllerCode: controllerFileRes.text,
      serviceName: files.service,
      serviceCode: serviceFileRes.text,
      formatId,
    };
    await postSSEJson("/api/apiTestCode/dbMap", payload, (evt) => {
      if (evt.type === "text-delta" && typeof evt.delta === "string") {
        if (evt.delta) setResultText((prev) => prev + evt.delta);
      }
    });

    // ここでDBマッピング定義ファイル名を指定
    const tmpName = files.controller.replace(/\.controller\.ts$/, "");
    setFile("dbMap", tmpName);
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
      <h2 className="p-1">DBマッピング仕様生成</h2>

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
          <h3>controller コード</h3>
          <input
            className="border rounded px-2 py-1"
            value={files.controller}
            placeholder="ファイル名を入力"
            onChange={(e) => setFile("controller", e.target.value)}
          />
        </div>

        <div>
          <h3>service コード</h3>
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
