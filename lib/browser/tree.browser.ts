// lib/browser/tree.ts
import { DirNode, TreeNode } from "@/contents/types/browser.type";

export function findNodeById(node: TreeNode, id: string): TreeNode | null {
  if (node.id === id) return node;
  if (node.kind !== "directory") return null;
  for (const c of node.children) {
    const found = findNodeById(c, id);
    if (found) return found;
  }
  return null;
}

export function cloneTree(node: DirNode): DirNode {
  return {
    ...node,
    children: node.children.map((c) =>
      c.kind === "file" ? { ...c } : cloneTree(c),
    ),
  };
}

/**
 * rootをcloneし、指定dirIdのDirNodeを「必要ならロードして」rootごと返す
 * - これを LocalPicker と DropZone で共通利用する
 */
export async function ensureDirLoadedInClonedRoot(
  root: DirNode,
  dirId: string,
  loader: (dir: DirNode) => Promise<void>,
) {
  const nextRoot = cloneTree(root);
  const node = findNodeById(nextRoot, dirId);
  if (!node || node.kind !== "directory") return { nextRoot, dir: null };

  if (!node.loaded) {
    await loader(node);
    node.loaded = true;
  }
  return { nextRoot, dir: node };
}

export async function collectFileNodes(
  dir: DirNode,
  ensureLoaded: (dir: DirNode) => Promise<void>,
): Promise<Extract<TreeNode, { kind: "file" }>[]> {
  const out: Extract<TreeNode, { kind: "file" }>[] = [];

  const walk = async (d: DirNode) => {
    if (!d.loaded) {
      await ensureLoaded(d);
      d.loaded = true;
    }
    for (const c of d.children) {
      if (c.kind === "file") out.push(c);
      else await walk(c);
    }
  };

  await walk(dir);
  return out;
}
