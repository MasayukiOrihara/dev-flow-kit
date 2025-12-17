export async function postSSEJson(
  url: string,
  body: unknown,
  onEvent: (evt: any) => void
) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(err || "request failed");
  }
  if (!res.body) throw new Error("ReadableStream not supported");

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");

  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buf += decoder.decode(value, { stream: true });

    // SSEは「\n\n」で1イベント区切り
    const parts = buf.split("\n\n");
    buf = parts.pop() ?? "";

    for (const part of parts) {
      // data: 行だけ拾う（複数行dataも一応結合）
      const dataLines = part
        .split("\n")
        .filter((l) => l.startsWith("data:"))
        .map((l) => l.replace(/^data:\s?/, ""));

      if (!dataLines.length) continue;

      const dataStr = dataLines.join("\n");
      try {
        onEvent(JSON.parse(dataStr));
      } catch {
        // JSONじゃないdataが混じる場合に備えて無視
      }
    }
  }
}
