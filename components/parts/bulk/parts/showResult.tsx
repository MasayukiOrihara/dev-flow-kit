type ShowResultProps = {
  result: string;
};

/**
 * 出力結果の内容を表示するコンポーネント
 * @param param0
 * @returns
 */
export function ShowResult({ result }: ShowResultProps) {
  return (
    <>
      {result ? (
        <>
          <h3 className="text-muted-foreground my-2">解析結果</h3>
          <div className="mb-16 overflow-y-auto scrollbar-hidden">
            <pre className="border text-xs rounded p-2 overflow-auto whitespace-pre-wrap scrollbar-hidden">
              {result}
            </pre>
          </div>
        </>
      ) : null}
    </>
  );
}
