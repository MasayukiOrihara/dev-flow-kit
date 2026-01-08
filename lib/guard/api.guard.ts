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
  message: string
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
  message: string
): PlainObject | Response => {
  if (!isPlainObject(body)) return badRequest(message);

  const v = body[key];
  if (!isPlainObject(v)) return badRequest(message);

  return v;
};
