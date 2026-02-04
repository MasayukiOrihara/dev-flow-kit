"use client";

import { ClassDesignBox } from "@/components/parts/bulk/classDesignBox";
import { UnitTestCodeBox } from "@/components/parts/bulk/unitTestCodeBox";
import { UnitTestDesignBox } from "@/components/parts/bulk/unitTestDesignBox";

export default function UnitTestCodePage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="border-b w-full mb-2">
        <h1 className="text-xl font-semibold">一括テストコード生成</h1>
        <p className="text-muted-foreground">ここに生成UIを置く</p>
      </header>

      <div className="flex h-full gap-2 min-w-0">
        <div className="flex-1">
          <ClassDesignBox />
        </div>
        <div className="flex-1">
          <UnitTestDesignBox />
        </div>
        <div className="flex-1">
          <UnitTestCodeBox />
        </div>
      </div>
    </div>
  );
}
