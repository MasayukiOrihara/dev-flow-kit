import { DirNode } from "@/contents/types/browser.type";

export function sortDirChildren(dir: DirNode) {
  dir.children.sort((x, y) => {
    if (x.kind !== y.kind) return x.kind === "directory" ? -1 : 1;
    return x.name.localeCompare(y.name, "ja");
  });
}
