"use client";

import { Button } from "@/components/ui/button";
import { FILE_READ_ERROR } from "@/contents/messages/error.message";
import { postJson } from "@/lib/api/postJson.api";
import { useEffect, useState } from "react";

export type ExcelSheets = Record<string, any[][]>;

/**
 * 単体テスト仕様書作成ページ
 * @returns
 */
export default function UnitTestDesignPage() {
  const [excelFileName, setExcelFileName] = useState("");
  const [codeFileName, setCodeFileName] = useState("");
  const [text, setText] = useState("");
  const [err, setErr] = useState("");

  const [templates, setTemplates] = useState<
    { id: string; label: string; enabled: boolean }[]
  >([]);
  const [formatId, setFormatId] = useState<string>("");

  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/prompts?kind=testDesign");
      const json = await res.json().catch(() => ({}));
      setTemplates(json.templates ?? []);
      if ((json.templates ?? []).length && !formatId)
        setFormatId(json.templates[0].id);
    })();
  }, []);

  /**
   * ファイルの読み込み
   * @returns
   */
  const load = async () => {
    if (isRunning) return;
    setErr("");
    setText("");
    setIsRunning(true);

    try {
      // 1) エクセルファイル読み込み
      const excelFileRes = await postJson<{ sheets: ExcelSheets }>(
        "/api/files/excelToJsonByName",
        { fileName: excelFileName },
        FILE_READ_ERROR
      );
      setText("Excelファイルを読み込みました。");

      // 2) コードファイル読み込み
      const codeFileRes = await postJson<{ text: string }>(
        "/api/files/textByName",
        { fileName: codeFileName },
        FILE_READ_ERROR
      );
      setText("コードファイルを読み込みました。");

      // 3) 結果生成
      setText("結果のファイルを生成しています...");
      const outputRes = await postJson<{ message: string }>(
        "/api/unitTestDesign",
        {
          fileName: codeFileName,
          codeText: codeFileRes.text,
          classDesign: excelFileRes.sheets,
          formatId,
        },
        "生成に失敗しました"
      );
      setText(outputRes.message);
    } catch (e: any) {
      console.error(e);
      setErr(e.message);
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
