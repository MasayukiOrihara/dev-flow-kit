"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { isErrnoException } from "@/lib/guard/error.guard";
import { TemplateItem } from "@/contents/types/prompt.type";

export type GenerateSectionRunArgs = {
  fileName: string;
  formatId: string;
};

type Props = {
  /** 見出し（例：① コードから解析） */
  title: string;
  /** 説明文 */
  description?: string;

  /** /api/prompts?kind=... の kind */
  promptKind: string;

  /** 入力欄ラベル（例：生成元コードのファイル名） */
  fileNameLabel?: string;
  /** 入力欄placeholder */
  fileNamePlaceholder?: string;

  /** 実行ボタン文字 */
  runButtonText?: string;

  /** 結果表示するか（①はtrue、②はfalseなど） */
  showResult?: boolean;

  /**
   * 実行処理（親が差し込む）
   * - 返り値は結果テキスト（showResult=false の場合は空文字でOK）
   */
  run: (args: GenerateSectionRunArgs) => Promise<string>;
};

export function GenerateSection({
  title,
  description,
  promptKind,
  fileNameLabel = "ファイル名",
  fileNamePlaceholder,
  runButtonText = "読み込み→生成",
  showResult = true,
  run,
}: Props) {
  const [fileName, setFileName] = useState("");
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [formatId, setFormatId] = useState("");

  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  // プロンプトの取得
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `/api/prompts?kind=${encodeURIComponent(promptKind)}`
        );
        const json = await res.json().catch(() => ({}));

        const list: TemplateItem[] = json.templates ?? [];
        setTemplates(list);

        if (!formatId && list.length) {
          const firstEnabled = list.find((t) => t.enabled) ?? list[0];
          setFormatId(firstEnabled.id);
        }
      } catch (e) {
        console.error(e);
        if (isErrnoException(e)) {
          setErr(e.message ?? "プロンプト一覧の取得に失敗しました");
        } else {
          setErr("プロンプト一覧の取得に失敗しました");
        }
      }
    })();
  }, []);

  const canRun = useMemo(() => {
    if (isRunning) return false;
    if (!fileName.trim()) return false;
    if (!formatId) return false;
    return true;
  }, [fileName, formatId, isRunning]);

  /**
   * ファイルの読み込み
   * @returns
   */
  const onRun = async () => {
    if (!canRun) return;

    setErr("");
    if (showResult) setText("");
    setIsRunning(true);

    try {
      const resultText = await run({
        fileName: fileName.trim(),
        formatId,
      });

      if (showResult) setText(resultText ?? "");
    } catch (e) {
      console.error(e);
      if (isErrnoException(e)) {
        setErr(e.message ?? "処理に失敗しました");
      } else {
        setErr("処理に失敗しました");
      }
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <section className="my-4">
      <h2 className="text-lg font-semibold">{title}</h2>

      {description ? (
        <p className="text-muted-foreground mt-1">{description}</p>
      ) : null}

      <div className="my-2">
        <div className="flex gap-2 items-center flex-wrap">
          <label className="text-sm text-muted-foreground">
            {fileNameLabel}
          </label>

          <input
            className="border rounded px-2 py-1"
            value={fileName}
            placeholder={fileNamePlaceholder}
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
            onClick={onRun}
            disabled={!canRun}
            className="bg-blue-400 hover:bg-blue-600"
          >
            {isRunning ? "処理中..." : runButtonText}
          </Button>
        </div>

        {err ? (
          <p className="text-red-400 font-bold text-sm mt-2">{err}</p>
        ) : null}
      </div>

      {showResult ? (
        <>
          <h3 className="text-muted-foreground mt-3">解析結果</h3>
          <pre className="border rounded p-3 overflow-auto whitespace-pre-wrap">
            {text}
          </pre>
        </>
      ) : null}
    </section>
  );
}
