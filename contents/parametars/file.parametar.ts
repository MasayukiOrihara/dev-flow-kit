import path from "node:path";

// env取得
const ENV_WORKSPACE_DIR = process.env.WORKSPACE_LOCAL_DIR;
const ENV_INPUT_DIR = process.env.INPUT_LOCAL_DIR;
const ENV_OUTPUT_DIR = process.env.OUTPUT_LOCAL_DIR;
const ENV_META_DIR = process.env.META_LOCAL_DIR;
const ENV_PROMPT_DIR = process.env.PROMPT_LOCAL_DIR;

// デフォルトファイルパス
const DEFAULT_WORKSPACE_DIR = "workspace";
const DEFAULT_INPUT_DIR = "workspace/inputs";
const DEFAULT_OUTPUT_DIR = "workspace/outputs";
const DEFAULT_META_DIR = "workspace/meta";
const DEFAULT_PROMPT_DIR = "workspace/prompts";

// ファイルパス
export const WORKSPACE_DIR = ENV_WORKSPACE_DIR ?? DEFAULT_WORKSPACE_DIR;
export const INPUT_DIR = ENV_INPUT_DIR ?? DEFAULT_INPUT_DIR;
export const META_DIR = ENV_META_DIR ?? DEFAULT_META_DIR;
export const PROMPT_DIR = ENV_PROMPT_DIR ?? DEFAULT_PROMPT_DIR;
export const OUTPUT_DIR = ENV_OUTPUT_DIR ?? DEFAULT_OUTPUT_DIR;

export const META_FILE = path.join(META_DIR, "files.json");
export const TEMPLATE_INDEX = path.join(PROMPT_DIR, "index.json");
export const CLASS_DESIGN_DIR = path.join(PROMPT_DIR, "classDesign");
export const TEST_DESIGN_DIR = path.join(PROMPT_DIR, "testDesign");
export const TEST_CODE_DIR = path.join(PROMPT_DIR, "testCode");
export const API_TEST_CODE_DIR = path.join(PROMPT_DIR, "apiTestCode");

// キー
export const DND_NODE_ID = "application/x-local-node-id";
