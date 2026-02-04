"use client";

import { usePromptTemplates } from "@/components/hooks/usePromptTemplates";
import { Button } from "@/components/ui/button";
import { useState } from "react";

// 定数
const CLASS_DESIGN_PROMPT_KIND = "classDesign";

export default function UnitTestCodePage() {
  const [fileName, setFileName] = useState("");
  const { templates, formatId, setFormatId } = usePromptTemplates(
    encodeURIComponent(CLASS_DESIGN_PROMPT_KIND),
  );

  return (
    <div className="flex flex-col h-full">
      <header className="border-b w-full mb-2">
        <h1 className="text-xl font-semibold">一括テストコード生成</h1>
        <p className="text-muted-foreground">ここに生成UIを置く</p>
      </header>

      <div className="flex h-full">
        <div className="border">
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

            {/* <Button
              onClick={onRun}
              disabled={!canRun}
              className="bg-blue-400 hover:bg-blue-600"
            >
              {isRunning ? "処理中..." : runButtonText}
            </Button> */}
          </div>

          <div>
            <h3>出力結果</h3>
          </div>
        </div>
        <div className="border">b</div>
        <div className="border">b</div>
      </div>
    </div>
  );
}
