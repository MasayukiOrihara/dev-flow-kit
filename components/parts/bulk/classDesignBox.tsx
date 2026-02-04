"use client";

import { useErrorMessage } from "@/components/hooks/page/useErrorMessage";
import { usePromptTemplates } from "@/components/hooks/page/usePromptTemplates";
import { Button } from "@/components/ui/button";
import {
  FILE_READ_ERROR,
  GENERATE_ERROR,
} from "@/contents/messages/error.message";
import { CLASS_DESIGN_PK } from "@/contents/parametars/file.parametar";
import { postJson } from "@/lib/api/postJson.api";
import { useMemo, useState } from "react";

export function ClassDesignBox() {
  const [fileName, setFileName] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const { templates, formatId, setFormatId } = usePromptTemplates(
    encodeURIComponent(CLASS_DESIGN_PK),
  );

  const [resultText, setResultText] = useState("");
  const { err, clearErr, run: runSafe } = useErrorMessage("処理に失敗しました");

  // 動作チェック
  const canRun = useMemo(() => {
    if (isRunning) return false;
    if (!fileName.trim()) return false;
    if (!formatId) return false;
    return true;
  }, [fileName, formatId, isRunning]);

  // 生成関数
  const runGenerateDesign = async ({
    fileName,
    formatId,
  }: {
    fileName: string;
    formatId: string;
  }) => {
    // 1) コードファイル読み込み
    const fileRes = await postJson<{ text: string }>(
      "/api/files/textByName",
      { fileName },
      FILE_READ_ERROR,
    );

    // 2) 出力処理
    const outputRes = await postJson<{ text: string }>(
      "/api/classDesign/toJson",
      { fileName, codeText: fileRes.text, formatId },
      GENERATE_ERROR,
    );

    return outputRes.text;
  };

  /**
   * 実行
   * @returns
   */
  const onRun = async () => {
    if (!canRun) return;

    clearErr();
    setIsRunning(true);

    try {
      const resultText = await runSafe(() =>
        runGenerateDesign({
          fileName: fileName.trim(),
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
      <h2 className="p-1">クラス仕様書生成</h2>

      <div className="flex flex-col gap-2">
        <div>
          <h3>対象コード</h3>
          <input
            className="border rounded px-2 py-1"
            value={fileName}
            placeholder="ファイル名を入力"
            onChange={(e) => setFileName(e.target.value)}
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
