"use client";

import { useErrorMessage } from "@/components/hooks/page/useErrorMessage";
import { useFileNames } from "@/components/hooks/page/useFileNames";
import { usePromptTemplates } from "@/components/hooks/page/usePromptTemplates";
import { useRunState } from "@/components/hooks/page/useRunState";
import { Button } from "@/components/ui/button";
import {
  FILE_READ_ERROR,
  GENERATE_ERROR,
} from "@/contents/messages/error.message";
import {
  CODE_READ_COMPLETE,
  NOW_READING,
  OUTPUT_RESULT,
  OUTPUT_RESULT_FAILED,
  RESULT_GENERATING,
} from "@/contents/messages/logger.message";
import { CLASS_DESIGN_PK } from "@/contents/parametars/file.parametar";
import { SaveJsonResult } from "@/contents/types/parts.type";
import { postJson } from "@/lib/api/postJson.api";
import { useMemo } from "react";
import { ShowResult } from "./parts/showResult";
import { StatusAndError } from "./parts/statusAndError";

type ClassDesignFileType = "sourceCode";

/**
 * クラス仕様書生成ボックス
 * @returns
 */
export function ClassDesignBox() {
  const { files, setFile } = useFileNames<ClassDesignFileType>({
    sourceCode: "",
  });
  const { templates, formatId, setFormatId } = usePromptTemplates(
    encodeURIComponent(CLASS_DESIGN_PK),
  );

  const { err, clearErr, run: runSafe } = useErrorMessage("処理に失敗しました");
  const log = useRunState();

  // 動作チェック
  const canRun = useMemo(() => {
    if (log.isRunning) return false;
    if (!files.sourceCode) return false;
    if (!formatId) return false;
    return true;
  }, [files.sourceCode, formatId, log.isRunning]);

  // 生成関数
  const runGenerateDesign = async ({
    fileName,
    formatId,
  }: {
    fileName: string;
    formatId: string;
  }): Promise<SaveJsonResult> => {
    // 1) コードファイル読み込み
    const fileRes = await postJson<{ text: string }>(
      "/api/files/textByName",
      { fileName },
      FILE_READ_ERROR,
    );
    log.setStatus(CODE_READ_COMPLETE);

    log.setStatus(RESULT_GENERATING);
    // 2) 出力処理
    const outputRes = await postJson<SaveJsonResult>(
      "/api/classDesign/toJson",
      { fileName, codeText: fileRes.text, formatId },
      GENERATE_ERROR,
    );
    if (outputRes.ok) {
      log.setStatus(`${OUTPUT_RESULT}: ${outputRes.savedPath}`);
    } else {
      log.setStatus(OUTPUT_RESULT_FAILED);
    }

    return outputRes;
  };

  /**
   * 実行
   * @returns
   */
  const onRun = async () => {
    if (!canRun) return;
    clearErr();
    log.start(NOW_READING);

    let result: SaveJsonResult | undefined;
    try {
      result = await runSafe(() =>
        runGenerateDesign({
          fileName: files.sourceCode,
          formatId,
        }),
      );
    } finally {
      if (!result?.ok) {
        log.finish("");
        return;
      }
      log.finish(result.json ?? "");
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
            value={files.sourceCode}
            placeholder="ファイル名を入力"
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
          {log.isRunning ? "処理中..." : "読み込み→生成"}
        </Button>

        <Button disabled={true}>EXCEL 出力</Button>
        <StatusAndError status={log.status} error={err} />
      </div>
      <ShowResult result={log.result} />
    </div>
  );
}
