import { DirNode } from "@/contents/types/browser.type";

/** node.id でディレクトリを探す */
export function findDirById(root: DirNode, id: string): DirNode | null {
  if (root.id === id) return root;
  for (const c of root.children) {
    if (c.kind === "directory") {
      const found = findDirById(c, id);
      if (found) return found;
    }
  }
  return null;
}
