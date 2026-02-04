"use client";

import { TemplateItem } from "@/contents/types/prompt.type";
import { useEffect, useRef, useState } from "react";

type ApiResp = { templates?: TemplateItem[] };

export function usePromptTemplates(kind: string) {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [formatId, setFormatId] = useState<string>("");

  // 「初期formatIdを自動セットしたか？」を追跡
  const initializedDefaultRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    initializedDefaultRef.current = false; // kind が変わったら初期化し直す

    (async () => {
      const res = await fetch(`/api/prompts?kind=${encodeURIComponent(kind)}`);
      const json = (await res.json().catch(() => ({}))) as ApiResp;

      if (cancelled) return;

      const list = json.templates ?? [];
      setTemplates(list);

      // formatId が空のときだけ、初回1回だけ default を入れる
      if (!initializedDefaultRef.current && list.length) {
        initializedDefaultRef.current = true;
        setFormatId((prev) => prev || list[0].id);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [kind]);

  return { templates, formatId, setFormatId };
}
