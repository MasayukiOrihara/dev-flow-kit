"use client";

import { useErrorMessage } from "@/components/hooks/page/useErrorMessage";
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
import { SheetsJson } from "@/contents/types/excel.type";
import { postJson } from "@/lib/api/postJson.api";
import { useMemo, useState } from "react";

// 定数
const UNIT_TEST_DESIGN_PROMPT_KIND = "testDesign";

export function UnitTestDesignBox() {
  const [excelFileName, setExcelFileName] = useState("");
  const [codeFileName, setCodeFileName] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const { templates, formatId, setFormatId } = usePromptTemplates(
    encodeURIComponent(UNIT_TEST_DESIGN_PROMPT_KIND),
  );

  const [statusText, setStatusText] = useState("");
  const { err, clearErr, run: runSafe } = useErrorMessage(UNKNOWN_ERROR);

  // 動作チェック
  const canRun = useMemo(() => {
    if (isRunning) return false;
    if (!excelFileName.trim()) return false;
    if (!codeFileName.trim()) return false;
    if (!formatId) return false;
    return true;
  }, [excelFileName, codeFileName, formatId, isRunning]);

  // 生成関数
  const runGenerateDesign = async ({ formatId }: { formatId: string }) => {
    setStatusText("");
    // 1) エクセルファイル読み込み
    const excelFileRes = await postJson<{ sheets: SheetsJson }>(
      "/api/files/excelToJsonByName",
      { fileName: excelFileName },
      FILE_READ_ERROR,
    );
    setStatusText(EXCEL_READ_COMPLETE);

    // 2) コードファイル読み込み
    const codeFileRes = await postJson<{ text: string }>(
      "/api/files/textByName",
      { fileName: codeFileName },
      FILE_READ_ERROR,
    );
    setStatusText(CODE_READ_COMPLETE);

    // 3) 結果生成
    setStatusText(RESULT_GENERATING);
    const outputRes = await postJson<{ message: string }>(
      "/api/unitTestDesign",
      {
        fileName: codeFileName,
        codeText: codeFileRes.text,
        classDesign: excelFileRes.sheets,
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
    <div className="w-[20%] border flex flex-col overflow-hidden">
      <h2 className="p-1">単体テスト仕様書生成</h2>

      <div className="flex flex-col gap-2">
        <div>
          <h3>クラス仕様書（EXCEL）</h3>
          <input
            className="border rounded px-2 py-1"
            value={excelFileName}
            placeholder="自動入力"
            onChange={(e) => setExcelFileName(e.target.value)}
          />
        </div>

        <div>
          <h3>対象コード</h3>
          <input
            className="border rounded px-2 py-1"
            value={codeFileName}
            placeholder="自動入力"
            onChange={(e) => setCodeFileName(e.target.value)}
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
