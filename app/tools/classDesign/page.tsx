"use client";

import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/api/postJson.api";
import { useEffect, useState } from "react";

/**
 * クラス仕様書生成ページ
 * @returns
 */
export default function ClassDesignPage() {
  const [fileName, setFileName] = useState("CurriculumDetail.tsx");
  const [text, setText] = useState("");
  const [err, setErr] = useState("");

  const [templates, setTemplates] = useState<
    { id: string; label: string; enabled: boolean }[]
  >([]);
  const [formatId, setFormatId] = useState<string>("class-basic");

  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/prompts?kind=classDesign");
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
      // 1) 読み込み
      const fileRes = await postJson<{ text: string }>(
        "/api/files/textByName",
        { fileName },
        "ファイルが読み込みできませんでした"
      );
      setText(fileRes.text);

      // 2) 結果生成
      const outputRes = await postJson<{ text: string }>(
        "/api/exportExcel/classDesign/toCode",
        { fileName, codeText: fileRes.text, formatId },
        "生成に失敗しました"
      );
      setText(outputRes.text);
    } catch (e: any) {
      console.error(e);
      setErr(e.message);
    } finally {
      setIsRunning(false);
    }
  };

  // todo: 出力ボタン作成

  return (
    <div>
      <div>
        <h1 className="text-xl font-semibold">クラス仕様書生成</h1>
        <p className="text-muted-foreground">「クラス仕様書」を生成する</p>
      </div>

      <div className="my-4">
        <h2>① コードから解析</h2>
        <div className="my-2">
          <h3 className="text-muted-foreground">
            生成元コードのファイル名と使用するプロンプトを指定してください
          </h3>
          <div className="flex gap-2 items-center">
            <input
              className="border rounded px-2 py-1"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
            />

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

            <Button
              onClick={load}
              disabled={isRunning}
              className="bg-blue-400 hover:bg-blue-600"
            >
              {isRunning ? "処理中..." : "読み込み→生成"}
            </Button>
          </div>

          {err ? <p className="text-red-400 font-bold text-sm">{err}</p> : null}
        </div>

        <h3 className="text-muted-foreground">解析結果</h3>
        <pre className="border rounded p-3 overflow-auto whitespace-pre-wrap">
          {text}
        </pre>
      </div>

      <div className="my-4">
        <h2>② 「機能一覧表」から生成する</h2>
        <p className="text-muted-foreground">未実装</p>
      </div>
    </div>
  );
}
