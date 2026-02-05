"use client";

import { useErrorMessage } from "@/components/hooks/page/useErrorMessage";
import { useFileNames } from "@/components/hooks/page/useFileNames";
import { usePromptTemplates } from "@/components/hooks/page/usePromptTemplates";
import { useRunState } from "@/components/hooks/page/useRunState";
import { Button } from "@/components/ui/button";
import { FILE_READ_ERROR } from "@/contents/messages/error.message";
import {
  CONTROLLERFILE_READ_COMPLETE,
  NOW_READING,
  PRISMAFILE_READ_COMPLETE,
  RESULT_GENERATING,
  SERVICEFILE_READ_COMPLETE,
} from "@/contents/messages/logger.message";
import { DB_MAPPING_PK } from "@/contents/parametars/file.parametar";
import { postJson } from "@/lib/api/postJson.api";
import { postSSEJson } from "@/lib/api/postSSEJson";
import { useMemo, useState } from "react";
import { ShowResult } from "./parts/showResult";
import { StatusAndError } from "./parts/statusAndError";
import { GenerateButton } from "./parts/generateButton";
import { OutputTSCode } from "./parts/outputTSCode";

type DBMappingFileType = "prismaSchema" | "controller" | "service";

/**
 * DBマッピング 生成ボックス
 * @returns
 */
export function DBMappingBox() {
  const { files, setFile, isReady } = useFileNames<DBMappingFileType>({
    prismaSchema: "",
    controller: "",
    service: "",
  });
  const [dbMap, setDBMap] = useState("");
  const { templates, formatId, setFormatId } = usePromptTemplates(
    encodeURIComponent(DB_MAPPING_PK),
  );
  const { err, clearErr, run: runSafe } = useErrorMessage("処理に失敗しました");
  const log = useRunState();

  // 動作チェック
  const canRun = useMemo(() => {
    if (log.isRunning) return false;
    if (!isReady) return false;
    if (!formatId) return false;
    return true;
  }, [isReady, formatId, log.isRunning]);

  // 生成関数
  const runGenerateDesign = async ({ formatId }: { formatId: string }) => {
    // 1) プリズマスキーマファイル読み込み
    const prismaSchemaRes = await postJson<{ text: string }>(
      "/api/files/textByName",
      { fileName: files.prismaSchema },
      FILE_READ_ERROR,
    );
    log.setStatus(PRISMAFILE_READ_COMPLETE);

    // 2) コントローラーコードファイル読み込み
    const controllerFileRes = await postJson<{ text: string }>(
      "/api/files/textByName",
      { fileName: files.controller },
      FILE_READ_ERROR,
    );
    log.setStatus(CONTROLLERFILE_READ_COMPLETE);

    // 2) サービスファイル読み込み
    const serviceFileRes = await postJson<{ text: string }>(
      "/api/files/textByName",
      { fileName: files.service },
      FILE_READ_ERROR,
    );
    log.setStatus(SERVICEFILE_READ_COMPLETE);

    // 3) 結果生成
    log.setStatus(RESULT_GENERATING);

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
        runGenerateDesign({
          formatId,
        }),
      );
    } finally {
      // ここでDBマッピング定義ファイル名を指定
      const tmpName = files.controller.replace(/\.controller\.ts$/, "");
      setDBMap(tmpName);

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
        "/api/apiTestCode/dbMap/exportYaml",
        { fileName: dbMap, llmText: log.result },
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
