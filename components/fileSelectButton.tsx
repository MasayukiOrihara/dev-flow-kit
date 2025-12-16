"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function FileSelectButton({ onUpload }: { onUpload: (e: any) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedNames, setSelectedNames] = useState<string>("");

  return (
    <div className="flex items-center gap-3">
      {/* 実体：非表示の input */}
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          const names = Array.from(e.target.files ?? [])
            .map((f) => f.name)
            .join(", ");
          setSelectedNames(names || "");
          onUpload(e);
        }}
      />

      {/* 見た目：Button */}
      <Button
        type="button"
        variant="default"
        className="bg-blue-400 hover:bg-blue-600"
        onClick={() => inputRef.current?.click()}
      >
        ファイル選択
      </Button>

      {/* ここは自前表示にできる */}
      <span className="text-sm text-muted-foreground">
        {selectedNames ? selectedNames : "選択されていません"}
      </span>
    </div>
  );
}
