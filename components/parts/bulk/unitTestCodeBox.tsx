"use client";

import { useErrorMessage } from "@/components/hooks/page/useErrorMessage";
import { useFileNames } from "@/components/hooks/page/useFileNames";
import { usePromptTemplates } from "@/components/hooks/page/usePromptTemplates";
import { Button } from "@/components/ui/button";
import {
  FILE_READ_ERROR,
  UNKNOWN_ERROR,
} from "@/contents/messages/error.message";
import {
  CODE_READ_COMPLETE,
  EXCEL_READ_COMPLETE,
  RESULT_GENERATING,
} from "@/contents/messages/logger.message";
import { UNIT_TEST_CODE_PK } from "@/contents/parametars/file.parametar";
import { SheetsJson } from "@/contents/types/excel.type";
import { postJson } from "@/lib/api/postJson.api";
import { postSSEJson } from "@/lib/api/postSSEJson";
import { useMemo, useState } from "react";

type UnitTestCodeFileType = "unitTestDesign" | "sourceCode";

/**
 * 単体テストコード生成ボックス
 * @returns
 */
export function UnitTestCodeBox() {
  const { files, setFile } = useFileNames<UnitTestCodeFileType>({
    unitTestDesign: "",
    sourceCode: "",
  });
  const [isRunning, setIsRunning] = useState(false);
  const { templates, formatId, setFormatId } = usePromptTemplates(
    encodeURIComponent(UNIT_TEST_CODE_PK),
  );

  const [resultText, setResultText] = useState("");
  const [statusText, setStatusText] = useState("");
  const { err, clearErr, run: runSafe } = useErrorMessage(UNKNOWN_ERROR);

  // 動作チェック
  const canRun = useMemo(() => {
    if (isRunning) return false;
    if (!files.unitTestDesign) return false;
    if (!files.sourceCode) return false;
    if (!formatId) return false;
    return true;
  }, [files.unitTestDesign, files.sourceCode, formatId, isRunning]);

  // 生成関数
  const runGenerateDesign = async ({ formatId }: { formatId: string }) => {
    setStatusText("");
    // 1) 単体テスト仕様書読み込み
    const unitTestFileRes = await postJson<{ text: string }>(
      "/api/files/textByName",
      { fileName: files.unitTestDesign },
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

    const payload = {
      fileName: files.sourceCode,
      codeText: codeFileRes.text,
      testDesign: unitTestFileRes.text,
      formatId,
    };
    await postSSEJson("/api/jestTestCode", payload, (evt) => {
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
      <h2 className="p-1">単体テストコード生成</h2>

      <div className="flex flex-col gap-2">
        <div>
          <h3>単体テスト仕様書</h3>
          <input
            className="border rounded px-2 py-1"
            value={files.unitTestDesign}
            placeholder="自動入力"
            onChange={(e) => setFile("unitTestDesign", e.target.value)}
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

        {err ? (
          <p className="text-red-400 font-bold text-sm mt-2">{err}</p>
        ) : null}
      </div>

      <div className="flex flex-col overflow-hidden">
        <h3>ステータス</h3>
        <div className="h-[40%]  overflow-y-auto scrollbar-hidden">
          {statusText ? (
            <>
              <h3 className="text-muted-foreground mt-3">解析結果</h3>
              <pre className="border rounded p-3 overflow-auto whitespace-pre-wrap scrollbar-hidden">
                {statusText}
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
