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
import { useState } from "react";

/**
 * 単体テスト仕様書作成ページ
 * @returns
 */
export default function UnitTestDesignPage() {
  const [excelFileName, setExcelFileName] = useState("");
  const [codeFileName, setCodeFileName] = useState("");
  const [text, setText] = useState("");
  const { err, clearErr, handleError } = useErrorMessage(UNKNOWN_ERROR);

  const { templates, formatId, setFormatId } = usePromptTemplates("testDesign");
  const [isRunning, setIsRunning] = useState(false);

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
      // 1) エクセルファイル読み込み
      const excelFileRes = await postJson<{ sheets: SheetsJson }>(
        "/api/files/excelToJsonByName",
        { fileName: excelFileName },
        FILE_READ_ERROR,
      );
      setText(EXCEL_READ_COMPLETE);

      // 2) コードファイル読み込み
      const codeFileRes = await postJson<{ text: string }>(
        "/api/files/textByName",
        { fileName: codeFileName },
        FILE_READ_ERROR,
      );
      setText(CODE_READ_COMPLETE);

      // 3) 結果生成
      setText(RESULT_GENERATING);
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
        <h1 className="text-xl font-semibold">単体テスト仕様書生成</h1>
        <p className="text-muted-foreground">「単体テスト仕様書」を生成する</p>
      </div>
      <div>
        <h2>〇 クラス仕様書（EXCEL）とコードから生成</h2>

        <div className="my-2">
          <h3 className="text-muted-foreground">
            生成元コードのファイル名と使用するプロンプトを指定してください
          </h3>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 my-2">
              <div>
                <p className="text-sm font-bold">クラス仕様書（EXCEL）</p>
                <input
                  className="border rounded px-2 py-1"
                  value={excelFileName}
                  onChange={(e) => setExcelFileName(e.target.value)}
                />
              </div>

              <div>
                <p className="text-sm font-bold">対象コードファイル</p>
                <input
                  className="border rounded px-2 py-1"
                  value={codeFileName}
                  onChange={(e) => setCodeFileName(e.target.value)}
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
