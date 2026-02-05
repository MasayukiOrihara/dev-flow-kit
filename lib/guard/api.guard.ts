// lib/guard.ts

import { PlainObject } from "@/contents/types/guard.type";
import { badRequest } from "./error.guard";
import { isPlainObject } from "./object.guard";

/**
 * 文字列で受け取る
 * @param body
 * @param key
 * @param message
 * @returns
 */
export const reqString = (
  body: unknown,
  key: string,
  message: string,
): string | Response => {
  if (!isPlainObject(body)) return badRequest(message);

  const v = body[key];
  if (typeof v !== "string" || v.trim() === "") return badRequest(message);

  return v;
};

/**
 * エクセルファイルを受け取る
 * @param body
 * @param key
 * @param message
 * @returns
 */
export const reqObject = (
  body: unknown,
  key: string,
  message: string,
): PlainObject | Response => {
  if (!isPlainObject(body)) return badRequest(message);

  const v = body[key];
  if (!isPlainObject(v)) return badRequest(message);

  return v;
};

export const reqFlag = (
  body: unknown,
  key: string,
  message: string,
): boolean | Response => {
  if (!isPlainObject(body)) return badRequest(message);

  // 無い場合は false 扱い（エラーにはしない）
  if (!(key in body)) return false;

  const v = body[key];

  // boolean 以外はエラー
  if (typeof v !== "boolean") return badRequest(message);

  return v;
};
