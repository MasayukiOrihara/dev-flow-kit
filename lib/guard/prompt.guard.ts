import { TemplateItem } from "@/contents/types/prompt.type";

/**
 * プロンプトのガード
 * @param v
 * @returns
 */
export const isTemplateItem = (v: unknown): v is TemplateItem =>
  typeof v === "object" &&
  v !== null &&
  typeof (v as Record<string, unknown>).id === "string" &&
  typeof (v as Record<string, unknown>).label === "string" &&
  typeof (v as Record<string, unknown>).kind === "string";
