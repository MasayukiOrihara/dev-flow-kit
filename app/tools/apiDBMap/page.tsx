"use client";

import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/api/postJson.api";
import { useEffect, useState } from "react";
import { postSSEJson } from "@/lib/api/postSSEJson";
import {
  FILE_READ_ERROR,
  UNKNOWN_ERROR,
} from "@/contents/messages/error.message";
import {
  CONTROLLERFILE_READ_COMPLETE,
  PRISMAFILE_READ_COMPLETE,
  RESULT_GENERATING,
  SERVICEFILE_READ_COMPLETE,
} from "@/contents/messages/logger.message";

export default function apiTestCodePage() {
  const [prismaSchemaName, setPrismaSchemaName] = useState("");
  const [controllerName, setControllerName] = useState("");
  const [serviceName, setServiceName] = useState("");

  const [dbMapName, setDbMapName] = useState("");

  const [text, setText] = useState("");
  const [err, setErr] = useState("");

  const [templates, setTemplates] = useState<
    { id: string; label: string; enabled: boolean }[]
  >([]);
  const [formatId, setFormatId] = useState<string>("");

  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/prompts?kind=apiTestCode");
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
      // 1) プリズマスキーマファイル読み込み
      const prismaSchemaRes = await postJson<{ text: string }>(
        "/api/files/textByName",
        { fileName: prismaSchemaName },
        FILE_READ_ERROR,
      );
      setText(PRISMAFILE_READ_COMPLETE);

      // 2) コントローラーコードファイル読み込み
      const controllerFileRes = await postJson<{ text: string }>(
        "/api/files/textByName",
        { fileName: controllerName },
        FILE_READ_ERROR,
      );
      setText(CONTROLLERFILE_READ_COMPLETE);

      // 2) サービスファイル読み込み
      const serviceFileRes = await postJson<{ text: string }>(
        "/api/files/textByName",
        { fileName: serviceName },
        FILE_READ_ERROR,
      );
      setText(SERVICEFILE_READ_COMPLETE);

      // 3) 結果生成
      setText(RESULT_GENERATING);
      setText("");

      const payload = {
        prismaSchema: prismaSchemaName,
        schemaCode: prismaSchemaRes.text,
        controllerName,
        controllerCode: controllerFileRes.text,
        serviceName,
        serviceCode: serviceFileRes.text,
        formatId,
      };
      await postSSEJson("/api/apiTestCode/dbMap", payload, (evt) => {
        if (evt.type === "text-delta" && typeof evt.delta === "string") {
          if (evt.delta) setText((prev) => prev + evt.delta);
        }
      });

      // ここでDBマッピング定義ファイル名を指定
      const tmpName = controllerName.replace(/\.controller\.ts$/, "");
      setDbMapName(tmpName);
    } catch (e) {
      if (e instanceof Error) {
        console.error(e);
        setErr(e.message);
      } else {
        console.error(e);
        setErr(UNKNOWN_ERROR);
      }
    } finally {
      setIsRunning(false);
    }
  };

  /**
   * テストコードをファイルで出力
   * @returns
   */
  const exportCode = async () => {
    if (isRunning) return;
    setErr("");
    setIsRunning(true);

    try {
      // 出力
      const res = await postJson<{ fileName: string }>(
        "/api/apiTestCode/dbMap/exportYaml",
        { fileName: dbMapName, llmText: text },
        FILE_READ_ERROR,
      );

      setText(`${res.fileName} を 出力しました`);
    } catch (e) {
      if (e instanceof Error) {
        console.error(e);
        setErr(e.message);
      } else {
        console.error(e);
        setErr(UNKNOWN_ERROR);
      }
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div>
      <div>
        <h1 className="text-xl font-semibold">DBマッピング生成</h1>
        <p className="text-muted-foreground">「DBマッピング」を生成する</p>
      </div>
      <div>
        <h2>① DB検証マッピング定義書を生成</h2>

        <div className="my-2">
          <h3 className="text-muted-foreground">
            生成元コードのファイル名と使用するプロンプトを指定してください
          </h3>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 my-2">
              <div>
                <p className="text-sm font-bold">schema.prisma</p>
                <input
                  className="border rounded px-2 py-1"
                  value={prismaSchemaName}
                  onChange={(e) => setPrismaSchemaName(e.target.value)}
                />
              </div>

              <div>
                <p className="text-sm font-bold">controllerのコード</p>
                <input
                  className="border rounded px-2 py-1"
                  value={controllerName}
                  onChange={(e) => setControllerName(e.target.value)}
                />
              </div>

              <div>
                <p className="text-sm font-bold">Serviceのコード</p>
                <input
                  className="border rounded px-2 py-1"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
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

              {text.length > 0 ? (
                <Button
                  variant="outline"
                  onClick={exportCode}
                  disabled={isRunning}
                  className="hover:bg-blue-600 ml-2"
                >
                  {isRunning ? "処理中..." : "結果ファイル出力"}
                </Button>
              ) : null}
            </div>

            {err ? (
              <p className="text-red-400 font-bold text-sm">{err}</p>
            ) : null}
          </div>

          <h3 className="text-muted-foreground">解析結果</h3>
          <pre className="border rounded p-3 overflow-auto whitespace-pre-wrap">
            {text}
          </pre>
        </div>
      </div>
    </div>
  );
}
