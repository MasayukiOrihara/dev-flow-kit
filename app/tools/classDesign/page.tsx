"use client";

import { GenerateSection } from "@/components/generateSection";
import { FILE_READ_ERROR } from "@/contents/messages/error.message";
import { postJson } from "@/lib/api/postJson.api";
import { ExcelSheets } from "../unitTestDesign/page";

/**
 * クラス仕様書生成ページ
 * @returns
 */
export default function ClassDesignPage() {
  return (
    <div>
      <div>
        <h1 className="text-xl font-semibold">クラス仕様書生成</h1>
        <p className="text-muted-foreground">「クラス仕様書」を生成する</p>
      </div>

      <div className="my-4">
        <GenerateSection
          title="① コードから解析"
          description="生成元コードのファイル名と使用するプロンプトを指定してください"
          promptKind="classDesign"
          fileNameLabel="ファイル名"
          showResult
          run={async ({ fileName, formatId }) => {
            const fileRes = await postJson<{ text: string }>(
              "/api/files/textByName",
              { fileName },
              FILE_READ_ERROR
            );

            const outputRes = await postJson<{ text: string }>(
              "/api/classDesign/toCode",
              { fileName, codeText: fileRes.text, formatId },
              "生成に失敗しました"
            );

            return outputRes.text;
          }}
        />
      </div>

      <div className="my-4">
        <GenerateSection
          title="② 「機能一覧表」から生成する"
          description="機能一覧表（EXCEL）のファイル名と使用するプロンプトを指定してください"
          promptKind="classDesign"
          fileNameLabel="ファイル名"
          showResult={true}
          run={async ({ fileName, formatId }) => {
            // 1) 機能一覧表（EXCEL）読み込み
            const screenFileRes = await postJson<{ sheets: ExcelSheets }>(
              "/api/files/excelToJsonByName",
              { fileName: fileName },
              FILE_READ_ERROR
            );

            const outputRes = await postJson<{ text: string }>(
              "/api/classDesign/fromFunctionList",
              { fileName, excelJson: screenFileRes.sheets, formatId },
              "生成に失敗しました"
            );
            return outputRes.text;
          }}
        />
      </div>
    </div>
  );
}
