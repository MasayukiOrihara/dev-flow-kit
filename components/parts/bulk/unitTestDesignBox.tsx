"use client";

import { useErrorMessage } from "@/components/hooks/page/useErrorMessage";
import { useFileNames } from "@/components/hooks/page/useFileNames";
import { usePromptTemplates } from "@/components/hooks/page/usePromptTemplates";
import { Button } from "@/components/ui/button";
import {
  FILE_READ_ERROR,
  GENERATE_ERROR,
  UNKNOWN_ERROR,
} from "@/contents/messages/error.message";
import {
  CODE_READ_COMPLETE,
  EXCEL_READ_COMPLETE,
  RESULT_GENERATING,
} from "@/contents/messages/logger.message";
import { UNIT_TEST_DESIGN_PK } from "@/contents/parametars/file.parametar";
import { postJson } from "@/lib/api/postJson.api";
import { useMemo, useState } from "react";

type UnitTestDesignFileType = "classDesign" | "sourceCode";

export function UnitTestDesignBox() {
  const { files, setFile } = useFileNames<UnitTestDesignFileType>({
    classDesign: "",
    sourceCode: "",
  });
  const [isRunning, setIsRunning] = useState(false);
  const { templates, formatId, setFormatId } = usePromptTemplates(
    encodeURIComponent(UNIT_TEST_DESIGN_PK),
  );

  const [statusText, setStatusText] = useState("");
  const [resultText, setResultText] = useState("");
  const { err, clearErr, run: runSafe } = useErrorMessage(UNKNOWN_ERROR);

  // 動作チェック
  const canRun = useMemo(() => {
    if (isRunning) return false;
    if (!files.classDesign) return false;
    if (!files.sourceCode) return false;
    if (!formatId) return false;
    return true;
  }, [files.classDesign, files.sourceCode, formatId, isRunning]);

  // 生成関数
  const runGenerateDesign = async ({ formatId }: { formatId: string }) => {
    setStatusText("");
    // 1) クラス仕様書読み込み
    const classFileRes = await postJson<{ text: String }>(
      "/api/files/textByName",
      { fileName: files.classDesign },
      FILE_READ_ERROR,
    );
    setStatusText(EXCEL_READ_COMPLETE);

    // 2) コードファイル読み込み
    const codeFileRes = await postJson<{ text: string }>(
      "/api/files/textByName",
      { fileName: files.sourceCode },
      FILE_READ_ERROR,
    );
    setStatusText(CODE_READ_COMPLETE);

    // 3) 結果生成
    setStatusText(RESULT_GENERATING);
    const outputRes = await postJson<{ message: string }>(
      "/api/unitTestDesign/toJson",
      {
        fileName: files.sourceCode,
        codeText: codeFileRes.text,
        classDesign: classFileRes.text,
        formatId,
      },
      GENERATE_ERROR,
    );

    setStatusText(outputRes.message);
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
      await runSafe(() =>
        runGenerateDesign({
          formatId,
        }),
      );
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-full px-1 shadow-sm overflow-hidden">
      <h2 className="p-1">単体テスト仕様書生成</h2>

      <div className="flex flex-col gap-2">
        <div>
          <h3>クラス仕様書</h3>
          <input
            className="border rounded px-2 py-1"
            value={files.classDesign}
            placeholder="自動入力"
            onChange={(e) => setFile("classDesign", e.target.value)}
          />
        </div>

        <div>
          <h3>対象コード</h3>
          <input
            className="border rounded px-2 py-1"
            value={files.sourceCode}
            placeholder="自動入力"
            onChange={(e) => setFile("sourceCode", e.target.value)}
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

        <div>
          {statusText ? (
            <p className="text-zinc-600 text-sm">{statusText}</p>
          ) : null}
          {err ? (
            <p className="text-red-400 font-bold text-sm mt-2">{err}</p>
          ) : null}
        </div>
      </div>

      {resultText ? (
        <>
          <h3 className="text-muted-foreground my-2">解析結果</h3>
          <div className="mb-8 overflow-y-auto scrollbar-hidden">
            <pre className="border text-xs rounded p-2 overflow-auto whitespace-pre-wrap scrollbar-hidden">
              {resultText}
            </pre>
          </div>
        </>
      ) : null}
    </div>
  );
}
