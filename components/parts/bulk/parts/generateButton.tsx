import { Button } from "@/components/ui/button";

type GenerateButton = {
  onRun: () => Promise<void>;
  canRun: boolean;
  isRunning: boolean;
};

/**
 * 生成ボタンコンポーネント
 * @param param0
 * @returns
 */
export function GenerateButton({ onRun, canRun, isRunning }: GenerateButton) {
  return (
    <Button
      onClick={onRun}
      disabled={!canRun}
      className="bg-blue-400 hover:bg-blue-600"
    >
      {isRunning ? "処理中..." : "読み込み→生成"}
    </Button>
  );
}
