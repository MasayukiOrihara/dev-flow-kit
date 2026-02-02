"use client";

import dynamic from "next/dynamic";

const LocalDirectoryTreePicker = dynamic(
  () => import("@/components/file/browser/LocalDirectoryTreePicker"),
  { ssr: false },
);

export default function LocalDirectoryTreePickerClient() {
  return <LocalDirectoryTreePicker />;
}
