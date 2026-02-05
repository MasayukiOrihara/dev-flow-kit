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
  DB_MAP_READ_COMPLETE,
  NOW_READING,
  OPEN_API_READ_COMPLETE,
  PRISMAFILE_READ_COMPLETE,
  RESULT_GENERATING,
} from "@/contents/messages/logger.message";
import { API_TEST_CODE_PK } from "@/contents/parametars/file.parametar";
import { postJson } from "@/lib/api/postJson.api";
import { postSSEJson } from "@/lib/api/postSSEJson";
import { useMemo, useState } from "react";
import { GenerateButton } from "./parts/generateButton";
import { StatusAndError } from "./parts/statusAndError";
import { ShowResult } from "./parts/showResult";

type ApiTestCodeFileType = "prismaSchema" | "dbMap" | "openAPI";

export function ApiTestCodeBox() {
  const { files, setFile, isReady } = useFileNames<ApiTestCodeFileType>({
    prismaSchema: "",
    dbMap: "",
    openAPI: "",
  });
  const { templates, formatId, setFormatId } = usePromptTemplates(
    encodeURIComponent(API_TEST_CODE_PK),
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
  const runGenerateCode = async ({ formatId }: { formatId: string }) => {
    // 1) プリズマスキーマファイル読み込み
    const prismaSchemaRes = await postJson<{ text: string }>(
      "/api/files/textByName",
      { fileName: files.prismaSchema },
      FILE_READ_ERROR,
    );
    log.setStatus(PRISMAFILE_READ_COMPLETE);

    // 2) openAPIファイル読み込み
    const openApiFileRes = await postJson<{ text: string }>(
      "/api/files/textByName",
      { fileName: files.openAPI },
      FILE_READ_ERROR,
    );
    log.setStatus(OPEN_API_READ_COMPLETE);

    // 2) DB マップファイル読み込み
    const dbMapFileRes = await postJson<{ text: string }>(
      "/api/files/textByName",
      { fileName: files.dbMap },
      FILE_READ_ERROR,
    );
    log.setStatus(DB_MAP_READ_COMPLETE);

    // 3) 結果生成
    log.setStatus(RESULT_GENERATING);

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
            value={files.openAPI}
            placeholder="ファイル名を入力"
            onChange={(e) => setFile("openAPI", e.target.value)}
          />
        </div>

        <div>
          <h3>DB マッピング定義</h3>
          <input
            className="border rounded px-2 py-1"
            value={files.dbMap}
            placeholder="ファイル名を入力"
            onChange={(e) => setFile("dbMap", e.target.value)}
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
        <StatusAndError status={log.status} error={err} />
      </div>
      <ShowResult result={log.result} />
    </div>
  );
}
