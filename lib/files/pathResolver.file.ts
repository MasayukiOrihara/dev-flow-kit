import path from "node:path";

type StorageDriver = "local" | "blob";

export function driver(): StorageDriver {
  return process.env.ENVIRONMENT === "blob" ? "blob" : "local";
}

/**
 * 論理パス → 実体パス（読み取り用）
 * - local: 絶対パス
 * - blob : URL
 */
export function resolveReadPath(logicalPath: string): string {
  if (driver() === "blob") {
    // すでにURLならそのまま
    if (/^https?:\/\//.test(logicalPath)) return logicalPath;

    const baseUrl = process.env.BLOB_BASE_URL;
    if (!baseUrl) {
      throw new Error("BLOB_BASE_URL is not defined");
    }
    return `${baseUrl.replace(/\/$/, "")}/${logicalPath}`;
  }

  // local
  if (path.isAbsolute(logicalPath)) return logicalPath;
  return path.join(process.cwd(), logicalPath);
}

/**
 * 論理パス → 実体パス（書き込み用・local限定）
 */
export function resolveLocalWritePath(logicalPath: string): string {
  if (driver() === "blob") {
    throw new Error("resolveLocalWritePath called in blob mode");
  }
  if (path.isAbsolute(logicalPath)) return logicalPath;
  return path.join(process.cwd(), logicalPath);
}

/**
 * 実体パス → 論理パス（meta保存用）
 * local/blob 共通
 */
export function toLogicalPath(p: string): string {
  // URLなら workspace/ 以降を抜き出す
  if (/^https?:\/\//.test(p)) {
    const idx = p.indexOf("/workspace/");
    return idx >= 0 ? p.slice(idx + 1) : p;
  }

  // 絶対パスなら cwd を削る
  const cwd = process.cwd();
  if (p.startsWith(cwd)) {
    return p.slice(cwd.length + 1);
  }
  return p;
}
