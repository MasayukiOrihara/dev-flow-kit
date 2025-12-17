// lib/guard.ts
const badRequest = (message: string) =>
  Response.json({ error: message }, { status: 400 });

export const reqString = (
  body: any,
  key: string,
  message: string
): string | Response => {
  const v = body?.[key];
  if (typeof v !== "string" || v.trim() === "") return badRequest(message);
  return v;
};

export const reqObject = <T extends object>(
  body: any,
  key: string,
  message: string
): T | Response => {
  const v = body?.[key];
  if (!v || typeof v !== "object" || Array.isArray(v))
    return badRequest(message);
  return v as T;
};
