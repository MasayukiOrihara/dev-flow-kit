import { getErrorMessage } from "@/lib/guard/error.guard";
import { useCallback, useState } from "react";

export function useErrorMessage(defaultMessage = "処理に失敗しました") {
  const [err, setErr] = useState<string | null>(null);

  // エラー内容のクリア
  const clearErr = useCallback(() => setErr(null), []);

  // エラー文字処理
  const handleError = useCallback(
    (e: unknown, overrideMessage?: string) => {
      console.error(e);
      setErr(getErrorMessage(e, overrideMessage ?? defaultMessage));
    },
    [defaultMessage],
  );

  // async を包む（try/catchを消すやつ）: ほぼ単一関数用、handle 使った方が可読性はいいです
  const run = useCallback(
    async <T>(fn: () => Promise<T>, overrideMessage?: string) => {
      try {
        clearErr();
        return await fn();
      } catch (e) {
        handleError(e, overrideMessage);
        return undefined;
      }
    },
    [clearErr, handleError],
  );

  return { err, setErr, clearErr, handleError, run };
}
