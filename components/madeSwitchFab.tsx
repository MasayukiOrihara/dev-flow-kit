"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function ModeSwitchFab() {
  const router = useRouter();
  const pathname = usePathname();

  const { label, targetPath } = useMemo(() => {
    const isBulk = pathname.startsWith("/bulk");

    return {
      label: isBulk ? "単体モードへ" : "一括モードへ",
      targetPath: isBulk ? "/tools/plan" : "/bulk/plan",
    };
  }, [pathname]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        type="button"
        onClick={() => router.push(targetPath)}
        size="lg"
        className="rounded-full shadow-lg"
      >
        {label}
      </Button>
    </div>
  );
}
