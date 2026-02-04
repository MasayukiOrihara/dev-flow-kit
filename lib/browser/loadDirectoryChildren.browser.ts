// lib/browser/loadDirectoryChildren.ts
import { DirNode } from "@/contents/types/browser.type";
import { joinPath } from "@/lib/browser/joinPath.browser";
import { upsertChildDir } from "@/lib/browser/upsertChildDir.browser";

export type LoadDirOpts = {
  onProgress?: (msg: string) => void;
  onCount?: (dirDelta: number, fileDelta: number) => void;
  isCancelled?: () => boolean;
  yieldEvery?: number; // UI固め防止
};

export async function loadDirectoryChildren(
  dir: DirNode,
  ignoreSet: Set<string>,
  opts: LoadDirOpts = {},
) {
  const { onProgress, onCount, isCancelled } = opts;
  const YIELD_EVERY = opts.yieldEvery ?? 200;

  let localDirs = 0;
  let localFiles = 0;

  // 既にロード済みなら何もしない
  if (dir.loaded) return;

  onProgress?.(`読み込み中: ${dir.path || dir.name}`);

  let tick = 0;

  for await (const [name, handle] of dir.handle.entries()) {
    if (isCancelled?.()) return;

    if (handle.kind === "directory") {
      if (ignoreSet.has(name)) continue;

      upsertChildDir(
        dir,
        name,
        joinPath(dir.path, name),
        handle as FileSystemDirectoryHandle,
      );
      localDirs += 1;
    } else {
      dir.children.push({
        id: crypto.randomUUID(),
        kind: "file",
        name,
        path: joinPath(dir.path, name),
        handle: handle as FileSystemFileHandle,
      });
      localFiles += 1;
    }

    tick += 1;
    if (tick % YIELD_EVERY === 0) {
      onCount?.(localDirs, localFiles);
      localDirs = 0;
      localFiles = 0;
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  onCount?.(localDirs, localFiles);
}
