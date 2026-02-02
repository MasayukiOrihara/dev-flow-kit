import { DirNode } from "@/contents/types/browser.type";

/** 深いコピー（スキャン中の部分更新用に最低限） */
export function cloneTree(node: DirNode): DirNode {
  return {
    ...node,
    children: node.children.map((c) =>
      c.kind === "file" ? { ...c } : cloneTree(c),
    ),
  };
}
