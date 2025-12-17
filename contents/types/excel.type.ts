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
