import {
  ComprehensiveTestCaseRow,
  TestCaseRow,
} from "../schemas/testCase.schema";

/** テストの種類 */
export type TestType = "unit" | "system";

/** エクセルペイロードの型 */
export type Payload = {
  fileName: string;
  cases: TestCaseRow[] | ComprehensiveTestCaseRow[];
};

// エクセルのファイル型
export type JsonCell = string | number | boolean | null;
export type JsonRow = JsonCell[];
export type SheetsJson = Record<string, JsonRow[]>;
