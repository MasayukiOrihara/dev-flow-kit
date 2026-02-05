"use client";

import { useErrorMessage } from "@/components/hooks/page/useErrorMessage";
import { useFileNames } from "@/components/hooks/page/useFileNames";
import { usePromptTemplates } from "@/components/hooks/page/usePromptTemplates";
import { useRunState } from "@/components/hooks/page/useRunState";
import { Button } from "@/components/ui/button";
import {
  FILE_READ_ERROR,
  UNKNOWN_ERROR,
} from "@/contents/messages/error.message";
import {
  CODE_READ_COMPLETE,
  NOW_READING,
  RESULT_GENERATING,
  UNIT_TEST_DESIGN_READ_COMPLETE,
} from "@/contents/messages/logger.message";
import { UNIT_TEST_CODE_PK } from "@/contents/parametars/file.parametar";
import { postJson } from "@/lib/api/postJson.api";
import { postSSEJson } from "@/lib/api/postSSEJson";
import { useMemo } from "react";
import { ShowResult } from "./parts/showResult";
import { StatusAndError } from "./parts/statusAndError";
import { GenerateButton } from "./parts/generateButton";
import { OutputTSCode } from "./parts/outputTSCode";

type UnitTestCodeFileType = "unitTestDesign" | "sourceCode";

/**
 * 単体テストコード生成ボックス
 * @returns
 */
export function UnitTestCodeBox() {
  const { files, setFile, isReady } = useFileNames<UnitTestCodeFileType>({
    unitTestDesign: "",
    sourceCode: "",
  });
  const { templates, formatId, setFormatId } = usePromptTemplates(
    encodeURIComponent(UNIT_TEST_CODE_PK),
  );
  const { err, clearErr, run: runSafe } = useErrorMessage(UNKNOWN_ERROR);
  const log = useRunState();

  // 動作チェック
  const canRun = useMemo(() => {
    if (log.isRunning) return false;
    if (!isReady) return false;
    if (!formatId) return false;
    return true;
  }, [isReady, formatId, log.isRunning]);

  // 生成関数
  const runGenerateCode = async ({
    formatId,
  }: {
    formatId: string;
  }): Promise<void> => {
    // 1) 単体テスト仕様書読み込み
    const unitTestFileRes = await postJson<{ text: string }>(
      "/api/files/textByName",
      { fileName: files.unitTestDesign },
      FILE_READ_ERROR,
    );
    log.setStatus(UNIT_TEST_DESIGN_READ_COMPLETE);

    // 2) コードファイル読み込み
    const codeFileRes = await postJson<{ text: string }>(
      "/api/files/textByName",
      { fileName: files.sourceCode },
      FILE_READ_ERROR,
    );
    log.setStatus(CODE_READ_COMPLETE);

    // 3) 結果生成
    log.setStatus(RESULT_GENERATING);
    const payload = {
      fileName: files.sourceCode,
      codeText: codeFileRes.text,
      testDesign: unitTestFileRes.text,
      isJson: true,
      formatId,
    };
    await postSSEJson("/api/jestTestCode", payload, (evt) => {
      if (evt.type === "text-delta" && typeof evt.delta === "string") {
        if (evt.delta) log.setResult((prev) => prev + evt.delta);
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
    log.start(NOW_READING);

    try {
      await runSafe(() =>
        runGenerateCode({
          formatId,
        }),
      );
    } finally {
      log.finishFlagOnry();
    }
  };

  /**
   * テストコードをファイルで出力
   * @returns
   */
  const exportCode = async () => {
    if (log.isRunning) return;
    clearErr();
    const tempResult = log.result;
    log.start(NOW_READING);

    try {
      // 出力
      const res = await postJson<{ fileName: string }>(
        "/api/jestTestCode/exportTSCode",
        { llmText: log.result },
        FILE_READ_ERROR,
      );

      log.setStatus(`${res.fileName} を 出力しました！`);
    } finally {
      log.finish(tempResult);
    }
  };

  // 出力ボタン表示
  const isOutputShow = log.result.length > 0 && canRun;

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

        <GenerateButton
          onRun={onRun}
          canRun={canRun}
          isRunning={log.isRunning}
        />
        <OutputTSCode
          isShow={isOutputShow}
          onClick={exportCode}
          isRunning={log.isRunning}
        />
        <StatusAndError status={log.status} error={err} />
      </div>
      <ShowResult result={log.result} />
    </div>
  );
}
