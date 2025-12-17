import path from "node:path";

// ファイルパス
export const INPUT_DIR = process.env.INPUT_DIR ?? "./workspace/inputs";
export const META_DIR = process.env.META_DIR ?? "./workspace/meta";
export const PROMPT_DIR = process.env.PROMPT_DIR ?? "./workspace/prompts";
export const OUTPUT_DIR = process.env.OUTPUT_DIR ?? "./workspace/outputs";

export const META_FILE = path.join(META_DIR, "files.json");
export const TEMPLATE_INDEX = path.join(PROMPT_DIR, "index.json");
export const CLASS_DESIGN_DIR = path.join(PROMPT_DIR, "classDesign");
export const TEST_DESIGN_DIR = path.join(PROMPT_DIR, "testDesign");
export const TEST_CODE_DIR = path.join(PROMPT_DIR, "testCode");
