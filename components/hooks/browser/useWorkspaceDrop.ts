// hooks/useWorkspaceDrop.ts
import { useState } from "react";
import { DirNode } from "@/contents/types/browser.type";
import { DND_NODE_ID } from "@/contents/parametars/file.parametar";
import { collectFileNodes, findNodeById } from "@/lib/browser/tree.browser";

export function useWorkspaceDrop({
  root,
  loadDirChildren,
  uploadFiles,
}: {
  root: DirNode | null;
  loadDirChildren: (dir: DirNode) => Promise<void>;
  uploadFiles: (files: File[]) => Promise<void>;
}) {
  const [status, setStatus] = useState("");
  const [isOver, setIsOver] = useState(false);

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    if (!root) return;

    const nodeId = e.dataTransfer.getData(DND_NODE_ID);
    if (!nodeId) return;

    const node = findNodeById(root, nodeId);
    if (!node || node.id === root.id) return;

    try {
      setStatus("準備中…");

      const files: File[] = [];
      if (node.kind === "file") {
        setStatus(`ファイル取得中: ${node.path}`);
        files.push(await node.handle.getFile());
      } else {
        const fileNodes = await collectFileNodes(node, loadDirChildren);
        setStatus(`ファイル取得中… 0/${fileNodes.length}`);

        let done = 0;
        for (const fn of fileNodes) {
          files.push(await fn.handle.getFile());
          done += 1;
          if (done % 20 === 0 || done === fileNodes.length) {
            setStatus(`ファイル取得中… ${done}/${fileNodes.length}`);
          }
        }
      }

      await uploadFiles(files);
      setStatus("アップロード完了");
    } catch (err) {
      setStatus(
        `アップロード失敗: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  return { status, isOver, setIsOver, onDrop, setStatus };
}
