"use client";

import { ClassDesignBox } from "@/components/parts/bulk/classDesignBox";

export default function UnitTestCodePage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="border-b w-full mb-2">
        <h1 className="text-xl font-semibold">一括テストコード生成</h1>
        <p className="text-muted-foreground">ここに生成UIを置く</p>
      </header>

      <div className="flex h-full">
        <ClassDesignBox />
        <ClassDesignBox />
        <div className="border">a</div>
      </div>
    </div>
  );
}
