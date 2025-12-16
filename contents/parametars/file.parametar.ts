import path from "node:path";

// ファイルパス
export const INPUT_DIR = process.env.INPUT_DIR ?? "./workspace/inputs";
export const META_DIR = process.env.META_DIR ?? "./workspace/meta";
export const META_FILE = path.join(META_DIR, "files.json");
