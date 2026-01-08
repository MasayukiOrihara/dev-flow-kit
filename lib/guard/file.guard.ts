/**
 * https かどうか判定
 * @param s
 * @returns
 */
export function isHttpUrl(s: string) {
  return /^https?:\/\//.test(s);
}

/**
 * Vercel Blob の URL っぽいか（雑でOK。必要なら強化）
 * @param s
 * @returns
 */
export function isVercelBlobUrl(s: string) {
  return isHttpUrl(s) && /vercel-storage\.com|blob\.vercel\.com/.test(s);
}
