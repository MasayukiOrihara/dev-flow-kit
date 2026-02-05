import { useCallback, useState } from "react";

export function useRunState() {
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState("");

  const start = useCallback((status = "処理中…") => {
    setIsRunning(true);
    setStatus(status);
    setResult("");
  }, []);

  const finish = useCallback((result: string) => {
    setIsRunning(false);
    setResult(result);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setStatus("");
    setResult("");
  }, []);

  return {
    isRunning,
    status,
    result,
    setStatus, // 途中経過更新用
    start,
    finish,
    reset,
  };
}
