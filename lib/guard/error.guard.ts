export const badRequest = (message: string) =>
  Response.json({ error: message }, { status: 400 });

export const notFound = (message: string) =>
  Response.json({ error: message }, { status: 404 });
