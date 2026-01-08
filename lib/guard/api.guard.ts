// lib/guard.ts
type PlainObject = Record<string, unknown>;

const isPlainObject = (v: unknown): v is PlainObject =>
  typeof v === "object" && v !== null && !Array.isArray(v);

export const badRequest = (message: string) =>
  Response.json({ error: message }, { status: 400 });

export const notFound = (message: string) =>
  Response.json({ error: message }, { status: 404 });

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
