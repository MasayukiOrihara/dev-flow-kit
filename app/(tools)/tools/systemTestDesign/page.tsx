"use client";

import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/api/postJson.api";
import { useState } from "react";
import {
  FILE_READ_ERROR,
  GENERATE_ERROR,
  UNKNOWN_ERROR,
} from "@/contents/messages/error.message";
import { SheetsJson } from "@/contents/types/excel.type";
import {
  FUNCTIONFILE_READ_COMPLETE,
  RESULT_GENERATING,
  SCREENFILE_READ_COMPLETE,
  SRSFILE_READ_COMPLETE,
} from "@/contents/messages/logger.message";
import { usePromptTemplates } from "@/components/hooks/page/usePromptTemplates";
import { useErrorMessage } from "@/components/hooks/page/useErrorMessage";
import { UNIT_TEST_DESIGN_PK } from "@/contents/parametars/file.parametar";

export default function SystemTestDesignPage() {
  const [functionFileName, setFunctionFileName] = useState("");
  const [srsFileName, setSRSFileName] = useState("");
  const [screenFileName, setScreenFileName] = useState("");
  const [text, setText] = useState("");
  const { err, clearErr, handleError } = useErrorMessage(UNKNOWN_ERROR);

  const [isRunning, setIsRunning] = useState(false);
  const { templates, formatId, setFormatId } =
    usePromptTemplates(UNIT_TEST_DESIGN_PK);

  /**
   * ファイルの読み込み
   * @returns
   */
  const load = async () => {
    if (isRunning) return;
    clearErr();
    setText("");
    setIsRunning(true);

    try {
      // 1) 機能一覧表（EXCEL）読み込み
      const functionFileRes = await postJson<{ sheets: SheetsJson }>(
        "/api/files/excelToJsonByName",
        { fileName: functionFileName },
        FILE_READ_ERROR,
      );
      setText(FUNCTIONFILE_READ_COMPLETE);

      // 2) 要求仕様書（TEXT）読み込み
      const srsFileRes = await postJson<{ text: string }>(
        "/api/files/textByName",
        { fileName: srsFileName },
        FILE_READ_ERROR,
      );
      setText(SRSFILE_READ_COMPLETE);

      // 3) 画面仕様書（EXCEL）読み込み
      const screenFileRes = await postJson<{ sheets: SheetsJson }>(
        "/api/files/excelToJsonByName",
        { fileName: screenFileName },
        FILE_READ_ERROR,
      );
      setText(SCREENFILE_READ_COMPLETE);

      // 4) 結果生成
      setText(RESULT_GENERATING);
      const outputRes = await postJson<{ message: string }>(
        "/api/systemTestDesign",
        {
          functionFile: functionFileRes.sheets,
          srsText: srsFileRes.text,
          screenFile: screenFileRes.sheets,
          formatId,
        },
        GENERATE_ERROR,
      );
      setText(outputRes.message);
    } catch (e) {
      handleError(e);
    } finally {
      setIsRunning(false);
    }
  };
  return (
    <div>
      <div>
        <h1 className="text-xl font-semibold">総合テスト仕様書生成</h1>
        <p className="text-muted-foreground">「総合テスト仕様書」を生成する</p>
      </div>
      <div>
        <h2>〇 それぞれの仕様書（EXCEL）とコードから生成</h2>

        <div className="my-2">
          <h3 className="text-muted-foreground">
            生成元のファイル名と使用するプロンプトを指定してください
          </h3>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 my-2">
              <div>
                <p className="text-sm font-bold">機能一覧表（EXCEL）</p>
                <input
                  className="border rounded px-2 py-1"
                  value={functionFileName}
                  onChange={(e) => setFunctionFileName(e.target.value)}
                />
              </div>

              <div>
                <p className="text-sm font-bold">要求仕様書（text）</p>
                <input
                  className="border rounded px-2 py-1"
                  value={srsFileName}
                  onChange={(e) => setSRSFileName(e.target.value)}
                />
              </div>

              <div>
                <p className="text-sm font-bold">画面仕様書（EXCEL）</p>
                <input
                  className="border rounded px-2 py-1"
                  value={screenFileName}
                  onChange={(e) => setScreenFileName(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-end gap-2 my-2">
              <div>
                <p className="text-sm font-bold">プロンプトテンプレート</p>
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
                onClick={load}
                disabled={isRunning}
                className="bg-blue-400 hover:bg-blue-600 ml-8"
              >
                {isRunning ? "処理中..." : "読み込み→生成"}
              </Button>
            </div>

            {err ? (
              <p className="text-red-400 font-bold text-sm">{err}</p>
            ) : null}
          </div>

          <h3 className="text-muted-foreground">解析結果</h3>
          <pre className="p-3 overflow-auto whitespace-pre-wrap">{text}</pre>
        </div>
      </div>
    </div>
  );
}
