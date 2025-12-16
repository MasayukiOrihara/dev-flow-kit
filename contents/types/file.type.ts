/**
 * ファイルのメタデータを取り扱う型
 */
export type FileMeta = {
  id: string;
  name: string;
  size: number;
  mime: string;
  savedPath?: string; // inputs配下の相対パス
  uploadedAt: string; // ISO
};
