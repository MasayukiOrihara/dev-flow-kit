"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

/**
 * クラス仕様書生成ページ
 * @returns
 */
export default function ClassDesignPage() {
  const [fileName, setFileName] = useState("CurriculumDetail.tsx");
  const [text, setText] = useState("");
  const [err, setErr] = useState("");

  const load = async () => {
    setErr("");
    setText("");

    const res = await fetch("/api/files/textByName", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setErr(json?.error ?? "failed");
      return;
    }

    setText(json.text ?? "");
  };

  return (
    <div>
      <div>
        <h1 className="text-xl font-semibold">クラス仕様書生成</h1>
        <p className="text-muted-foreground">「クラス仕様書」を生成する</p>
      </div>

      <div className="my-4">
        <h2>① コードから生成する</h2>
        <div className="flex gap-2 items-center">
          <input
            className="border rounded px-2 py-1"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
          />
          <Button onClick={load} className="active:brightness-90">
            読み込み
          </Button>
        </div>

        {err ? <p className="text-red-600">{err}</p> : null}

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
