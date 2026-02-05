import { Button } from "@/components/ui/button";

type OutputTSCode = {
  isShow: boolean;
  onClick: () => Promise<void>;
  isRunning: boolean;
};

/**
 * 出力コンポーネント
 * @param param0
 * @returns
 */
export function OutputTSCode({ isShow, onClick, isRunning }: OutputTSCode) {
  return (
    <>
      {isShow ? (
        <Button
          variant="outline"
          onClick={onClick}
          disabled={isRunning}
          className="hover:bg-blue-600 ml-2"
        >
          {isRunning ? "処理中..." : "TS コード出力"}
        </Button>
      ) : null}
    </>
  );
}
