import { useMemo, useState } from "react";

type UseIgnoreSetOptions = {
  initial?: string[];
  separator?: string;
};

export function useIgnoreSet(options?: UseIgnoreSetOptions) {
  const {
    initial = [
      "node_modules",
      ".git",
      ".next",
      "dist",
      "build",
      "coverage",
      ".turbo",
    ],
    separator = ",",
  } = options ?? {};

  const [ignoreText, setIgnoreText] = useState(initial.join(separator));

  const ignoreSet = useMemo(() => {
    return new Set(
      ignoreText
        .split(separator)
        .map((s) => s.trim())
        .filter(Boolean),
    );
  }, [ignoreText, separator]);

  return {
    ignoreText,
    setIgnoreText,
    ignoreSet,
  };
}
