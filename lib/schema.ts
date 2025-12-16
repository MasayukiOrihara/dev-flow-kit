import { z } from "zod";

/**
 * markdown の情報を取得するときのスキーマ
 */
export const MarkdownInfoSchema = z.object({
  file: z.string().trim().min(1),
  dir: z.string().trim().min(1),
  // 必要な項目を追加
});
export type MarkdownInfo = z.infer<typeof MarkdownInfoSchema>;

/**
 * エラーログを取り扱うスキーマ
 */
export const SeveritySchema = z.enum(["error", "warn", "info"]).optional();

export const AppErrorSchema = z
  .object({
    id: z.string(), // crypto.randomUUID() を想定
    sessionId: z.string().optional(),
    message: z.string().trim().min(1).max(2000), // 空文字を禁止
    detail: z.string().max(10000).optional(),
    name: z.string().max(200).optional(),
    stack: z.string().max(20000).optional(),
    componentStack: z.string().max(20000).optional(),
    timestamp: z
      .number()
      .int()
      .nonnegative()
      .refine(
        (ts) => ts < Date.now() + 5 * 60_000,
        "timestamp is in the future"
      ),
    severity: SeveritySchema,
    tags: z.array(z.string().trim().min(1).max(64)).max(20).optional(),
    hash: z.string().max(200).optional(),
    sent: z.boolean().optional(),
  })
  .strict(); // 余計なキーを拒否（許可したいなら .passthrough()）
export type AppErrorDTO = z.infer<typeof AppErrorSchema>;

export const ErrorLogsPayloadSchema = z
  .object({
    logs: z.array(AppErrorSchema).min(1).max(100), // 一度に送りすぎ防止
  })
  .strict();
export type ErrorLogsPayload = z.infer<typeof ErrorLogsPayloadSchema>;

/**
 * 各テストケースの1行分（Excelの1レコード）
 */
export const TestCaseRowSchema = z.object({
  /** No列：大項目番号 */
  no_dai: z.number().int().nonnegative(),
  /** No列：中項目番号 */
  no_chu: z.number().int().nonnegative(),
  /** No列：小項目番号 */
  no_sho: z.number().int().nonnegative(),

  /** 機能ID（例: FU-CUL001） */
  func_id: z.string().min(1),
  /** 機能名称（例: カリキュラム一覧：0件時のUI表示） */
  func_name: z.string().min(1),

  /** 確認内容：大項目 */
  check_major: z.string().min(1),
  /** 確認内容：中項目 */
  check_middle: z.string().min(1),

  /** テスト手順：箇条書き配列 */
  steps: z.array(z.string().min(1)).nonempty(),
  /** 期待値：箇条書き配列 */
  expected: z.array(z.string().min(1)).nonempty(),

  /** 実施日（空欄も許可） */
  exec_date: z.string().optional().or(z.literal("")),
  /** 実施結果（空欄も許可） */
  exec_result: z.string().optional().or(z.literal("")),

  /** 備考・要確認メモ：箇条書き */
  remarks: z.array(z.string()).default([]),
});

export const TestCaseRowArraySchema = z.array(TestCaseRowSchema).nonempty();

export type TestCaseRow = z.infer<typeof TestCaseRowSchema>;
export type TestCaseRowArray = z.infer<typeof TestCaseRowArraySchema>;

export const ComprehensiveTestCaseRowSchema = z.object({
  /** No列：大項目番号 */
  no_dai: z.number().int().nonnegative(),
  /** No列：中項目番号 */
  no_chu: z.number().int().nonnegative(),
  /** No列：小項目番号 */
  no_sho: z.number().int().nonnegative(),

  /** 機能ID（例: FU-CUL001） */
  func_id: z.string().min(1),
  /** 機能名称（例: カリキュラム一覧：0件時のUI表示） */
  func_name: z.string().min(1),

  /** 確認内容：大項目 */
  check_major: z.string().min(1),
  /** 確認内容：中項目 */
  check_middle: z.string().min(1),

  /** テスト手順：箇条書き配列 */
  steps: z.array(z.string().min(1)).nonempty(),
  /** 期待値：箇条書き配列 */
  expected: z.array(z.string().min(1)).nonempty(),

  /** 実施日（空欄も許可） */
  exec_date: z.string().optional().or(z.literal("")),
  /** 実施結果（空欄も許可） */
  exec_result: z.string().optional().or(z.literal("")),

  /** 前提条件：箇条書き */
  precondition: z.array(z.string()).default([]),

  /** 備考・要確認メモ：箇条書き */
  remarks: z.array(z.string()).default([]),
});

export const ComprehensiveTestCaseRowArraySchema = z
  .array(ComprehensiveTestCaseRowSchema)
  .nonempty();

export type ComprehensiveTestCaseRow = z.infer<
  typeof ComprehensiveTestCaseRowSchema
>;
export type ComprehensiveTestCaseRowArray = z.infer<
  typeof ComprehensiveTestCaseRowArraySchema
>;
