/**
 * サイドバーのitem要素
 */
export type SidebarItem = {
  href: string;
  label: string;
  enabled?: boolean; // ← 未実装は false, 省略時true扱い
  titleWhenDisabled?: string; // 例: "準備中"
};

// json を保存したときの返す型
export type SaveJsonOk = {
  ok: true;
  savedPath: string;
  metaId: string;
  json: string;
};

export type SaveJsonNg = {
  ok: false;
  errorType: "VALIDATION_ERROR" | "WRITE_ERROR";
  message: string;
  issues?: unknown;
};

export type SaveJsonResult = SaveJsonOk | SaveJsonNg;
