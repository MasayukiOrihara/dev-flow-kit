import { PlainObject } from "@/contents/types/guard.type";

/**
 * ブレーンオブジェクト判定
 * @param v
 * @returns
 */
export const isPlainObject = (v: unknown): v is PlainObject =>
  typeof v === "object" && v !== null && !Array.isArray(v);
