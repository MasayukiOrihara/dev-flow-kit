import path from "path";
import crypto from "crypto";
import { promises as fs } from "fs";
import { z, ZodType } from "zod";
import { SaveJsonResult } from "@/contents/types/parts.type";
import { OUTPUT_DIR } from "@/contents/parametars/file.parametar";
import { readMeta, writeMeta } from "./meta.file";
import { JSON_MINE } from "@/contents/messages/mine.message";

type SaveJsonOptions<T> = {
  data: unknown; // LLM出力とか外部入力想定なら unknown 推奨
  schema: ZodType<T>; // ControllerSummarySchema など
  sourceFileName: string; // files.controller とか
  artifactKey: string; // "controller-summary" / "test-spec" etc
  buildBaseName?: (sourceFileName: string) => string; // 任意（省略時は拡張子を落とす）
};

export async function saveJsonArtifact<T>({
  data,
  schema,
  sourceFileName,
  artifactKey,
  buildBaseName,
}: SaveJsonOptions<T>): Promise<SaveJsonResult> {
  const result = schema.safeParse(data);

  if (!result.success) {
    return {
      ok: false,
      errorType: "VALIDATION_ERROR",
      message: "Schema validation failed",
      issues: result.error.issues,
    };
  }

  try {
    // ベース名生成（デフォルト：拡張子を落とす）
    const base =
      buildBaseName?.(sourceFileName) ??
      path.basename(sourceFileName).replace(/\.[^.]+$/, "");

    const id = crypto.randomUUID();
    const nameId = id.replace(/-/g, "").slice(0, 12);

    const outputFileName = `${base}_${artifactKey}_${nameId}.json`;
    const safeFileName = path.basename(outputFileName);
    const filePath = path.join(OUTPUT_DIR, safeFileName);

    const jsonText = JSON.stringify(result.data, null, 2);

    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    await fs.writeFile(filePath, jsonText, "utf8");

    const metaList = await readMeta();
    const buf = new TextEncoder().encode(jsonText);

    metaList.unshift({
      id,
      name: safeFileName,
      size: buf.length,
      mime: JSON_MINE,
      savedPath: filePath,
      uploadedAt: new Date().toISOString(),
    });

    await writeMeta(metaList);

    return {
      ok: true,
      savedPath: filePath,
      metaId: id,
      json: jsonText,
    };
  } catch (err) {
    return {
      ok: false,
      errorType: "WRITE_ERROR",
      message: err instanceof Error ? err.message : String(err),
    };
  }
}
