"use client";

import React from "react";
import { TreeNode } from "@/contents/types/browser.type";
import { DND_NODE_ID } from "@/contents/parametars/file.parametar";

export function TreeRow({
  node,
  level,
  expanded,
  onToggle,
}: {
  node: TreeNode;
  level: number;
  expanded: Set<string>;
  onToggle: (id: string) => void | Promise<void>;
}) {
  const isDir = node.kind === "directory";
  const isOpen = isDir && expanded.has(node.id);
  const paddingLabel = 6;

  return (
    <div
      className="select-none"
      style={{ paddingLeft: `${level * paddingLabel}px` }}
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        e.dataTransfer.setData(DND_NODE_ID, node.id);
        e.dataTransfer.effectAllowed = "copy";
        e.dataTransfer.setData("text/plain", node.id); // 保険
      }}
    >
      <div className="flex items-center gap-1 hover:bg-muted/40 rounded py-0.2">
        {isDir ? (
          <button
            type="button"
            onClick={() => void onToggle(node.id)}
            className="w-4 h-6 grid place-items-center rounded hover:bg-muted"
            aria-label={isOpen ? "collapse" : "expand"}
            title={node.loaded ? "" : "未読み込み（開くと読み込み）"}
          >
            {isOpen ? "▾" : "▸"}
          </button>
        ) : (
          <span className="w-4 text-center opacity-40">•</span>
        )}

        <span className="font-mono text-sm opacity-70">
          {isDir ? "📁" : "📄"}
        </span>
        <span className="text-sm">{node.name}</span>

        <span className="ml-auto text-xs opacity-60 flex items-center gap-1 font-mono">
          {node.kind === "file" && <span title="File">F</span>}
          {node.kind === "directory" &&
            (node.loaded ? (
              <span title="Loaded">L</span>
            ) : (
              <span title="Not loaded">…</span>
            ))}
        </span>
      </div>

      {isDir && isOpen && (
        <div>
          {node.children.length === 0 && !node.loaded ? (
            <div
              className="text-xs opacity-60 px-2 py-2"
              style={{ paddingLeft: `${(level + 1) * paddingLabel}px` }}
            >
              （未読み込み）
            </div>
          ) : node.children.length === 0 ? (
            <div
              className="text-xs opacity-60 px-2 py-2"
              style={{ paddingLeft: `${(level + 1) * paddingLabel}px` }}
            >
              （空）
            </div>
          ) : (
            node.children.map((c) => (
              <TreeRow
                key={c.id}
                node={c}
                level={level + 1}
                expanded={expanded}
                onToggle={onToggle}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
