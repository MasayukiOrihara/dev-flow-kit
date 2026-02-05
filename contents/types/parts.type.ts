/**
 * サイドバーのitem要素
 */
export type SidebarItem = {
  href: string;
  label: string;
  enabled?: boolean; // ← 未実装は false, 省略時true扱い
  titleWhenDisabled?: string; // 例: "準備中"
};

/**
 * クラス仕様書作成で json が返ってくるときの型
 */
export type SaveClassResultJson =
  | { ok: true; savedPath: string; metaId: string; json: string }
  | {
      ok: false;
      errorType: "VALIDATION_ERROR" | "WRITE_ERROR";
      message: string;
      issues?: unknown;
    };
