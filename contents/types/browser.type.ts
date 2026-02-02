type TreeNodeBase = {
  id: string;
  name: string;
  path: string; // relative path e.g. "src/controllers"
};

export type FileNode = TreeNodeBase & {
  kind: "file";
  handle: FileSystemFileHandle; // ★ Fileはまだ読まない（遅延ロード）
  size?: number;
  lastModified?: number;
};

export type DirNode = TreeNodeBase & {
  kind: "directory";
  handle: FileSystemDirectoryHandle;
  children: TreeNode[];
  loaded: boolean; // ★ childrenが走査済みか（遅延ロードで使う）
};

export type TreeNode = FileNode | DirNode;
