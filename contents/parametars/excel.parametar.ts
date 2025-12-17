type Col = { key: string; width: number };
type HeaderCell = { addr: string; value: string; merge?: string };

/**
 * 出力エクセルタイプ別のコンフィグ
 */
export const CONFIG = {
  system: {
    cols: [
      { key: "no_dai", width: 6 },
      { key: "no_chu", width: 6 },
      { key: "no_sho", width: 6 },
      { key: "func_id", width: 14 },
      { key: "func_name", width: 28 },
      { key: "check_major", width: 22 },
      { key: "check_middle", width: 40 },
      { key: "steps", width: 44 },
      { key: "expected", width: 44 },
      { key: "exec_date", width: 12 },
      { key: "exec_result", width: 12 },
      { key: "precondition", width: 44 }, // ★ systemだけ
      { key: "remarks", width: 44 },
    ] satisfies Col[],
    extraHeaders: [
      { addr: "L1", value: "前提条件", merge: "L1:L2" },
      { addr: "M1", value: "備考", merge: "M1:M2" },
    ] satisfies HeaderCell[],
    headerCells: ["L1", "M1"],
  },

  unit: {
    cols: [
      { key: "no_dai", width: 6 },
      { key: "no_chu", width: 6 },
      { key: "no_sho", width: 6 },
      { key: "func_id", width: 14 },
      { key: "func_name", width: 28 },
      { key: "check_major", width: 22 },
      { key: "check_middle", width: 40 },
      { key: "steps", width: 44 },
      { key: "expected", width: 44 },
      { key: "exec_date", width: 12 },
      { key: "exec_result", width: 12 },
      { key: "remarks", width: 44 },
    ] satisfies Col[],
    extraHeaders: [
      { addr: "L1", value: "備考", merge: "L1:L2" },
    ] satisfies HeaderCell[],
    headerCells: ["L1"],
  },
} as const;
