import { DirNode } from "@/contents/types/browser.type";

export function upsertChildDir(
  parent: DirNode,
  name: string,
  path: string,
  handle: FileSystemDirectoryHandle,
) {
  const existing = parent.children.find(
    (c) => c.kind === "directory" && c.name === name,
  ) as DirNode | undefined;
  if (existing) return existing;

  const newDir: DirNode = {
    id: crypto.randomUUID(),
    kind: "directory",
    name,
    path,
    handle,
    children: [],
    loaded: false,
  };
  parent.children.push(newDir);
  return newDir;
}
