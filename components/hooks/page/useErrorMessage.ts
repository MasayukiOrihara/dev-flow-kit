import { getErrorMessage } from "@/lib/guard/error.guard";
import { useCallback, useState } from "react";

export function useErrorMessage(defaultMessage = "処理に失敗しました") {
  const [err, setErr] = useState<string | null>(null);

  const clearErr = useCallback(() => setErr(null), []);

  const handleError = useCallback(
    (e: unknown, overrideMessage?: string) => {
      console.error(e);
      setErr(getErrorMessage(e, overrideMessage ?? defaultMessage));
    },
    [defaultMessage],
  );

  // async を包む（try/catchを消すやつ）
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
