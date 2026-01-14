/** ```ts/tsx/typescript``` のコードブロックを1つ抜く */
export function extractCodeBlock(text: string): string {
  const match = text.match(/```(?:ts|typescript|tsx)?\s*([\s\S]*?)```/i);
  return match ? match[1].trim() : "";
}

/** ```yaml``` のコードブロックを1つ抜く */
export function extractYamlCodeBlock(text: string): string {
  const match = text.match(/```(?:yaml|yml|YAML)\s*([\s\S]*?)```/i);
  return match ? match[1].trim() : "";
}
