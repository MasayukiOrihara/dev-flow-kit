import { useEffect, useRef, useState } from "react";

type Timer = ReturnType<typeof setTimeout>;

export function useClipboardCopy(resetMs = 1200) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const timersRef = useRef<Record<string, Timer>>({});

  const copyToClipboard = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);

    // 連打対応：既存タイマーがあれば消して、時間をリセット
    const prev = timersRef.current[id];
    if (prev) clearTimeout(prev);

    timersRef.current[id] = setTimeout(() => {
      setCopiedId((prevId) => (prevId === id ? null : prevId));
      delete timersRef.current[id];
    }, resetMs);
  };

  // unmount 時に全タイマー掃除（メモリリーク対策）
  useEffect(() => {
    return () => {
      for (const t of Object.values(timersRef.current)) clearTimeout(t);
      timersRef.current = {};
    };
  }, []);

  return { copiedId, copyToClipboard, setCopiedId };
}
