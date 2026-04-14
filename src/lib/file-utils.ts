import { MAX_FILE_MB, MAX_FILES } from "./constants";
import type { FileItem } from "./types";

export const fmtMB = (bytes: number) =>
  (bytes / 1024 / 1024).toFixed(1) + " MB";

export function fmtDue(due: string): string {
  return new Date(due).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "short",
  });
}

export function makeFileItems(
  files: File[],
  currentCount: number,
): { items: FileItem[]; rejected: number; overflow: number } {
  const remaining = MAX_FILES - currentCount;
  const valid     = files.filter(f => f.size <= MAX_FILE_MB * 1024 * 1024);
  const rejected  = files.length - valid.length;
  const toAdd     = valid.slice(0, remaining);
  const overflow  = valid.length - toAdd.length;
  const items: FileItem[] = toAdd.map(f => ({
    file:       f,
    previewUrl: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
  }));
  return { items, rejected, overflow };
}
