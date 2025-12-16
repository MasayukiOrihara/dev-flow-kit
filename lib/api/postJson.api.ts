export async function postJson<T>(
  url: string,
  body: unknown,
  errorMessage: string
): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json?.error ?? errorMessage);
  }

  return json as T;
}
