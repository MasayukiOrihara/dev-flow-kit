/**
 * ステータスとエラーの表示部分
 * @param param0
 * @returns
 */
export function StatusAndError({
  status,
  error,
}: {
  status: string;
  error?: string | null;
}) {
  return (
    <div>
      {status ? <p className="text-zinc-600 text-sm">{status}</p> : null}
      {error ? (
        <p className="text-red-400 font-bold text-sm mt-2">{error}</p>
      ) : null}
    </div>
  );
}
