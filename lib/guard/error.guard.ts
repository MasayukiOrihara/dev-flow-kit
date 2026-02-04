export const badRequest = (message: string) =>
  Response.json({ error: message }, { status: 400 });

export const notFound = (message: string) =>
  Response.json({ error: message }, { status: 404 });

/**エラーオブジェクトかどうか
 *
 * @param e
 * @returns
 */
export function isErrnoException(e: unknown): e is NodeJS.ErrnoException {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    typeof (e as { code?: unknown }).code === "string"
  );
}

/**
 * エラーメッセージ出力
 * @param e
 * @param fallback
 * @returns
 */
export function getErrorMessage(e: unknown, fallback = "処理に失敗しました") {
  if (isErrnoException(e)) return e.message ?? fallback;
  return fallback;
}
