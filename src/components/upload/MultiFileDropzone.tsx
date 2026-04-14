"use client";

import { CloudUpload } from "lucide-react";
import { DS } from "@/lib/design-tokens";
import { MAX_FILE_MB } from "@/lib/constants";
import type { FileItem } from "@/lib/types";
import { FileThumb } from "./FileThumb";

interface MultiFileDropzoneProps {
  fileItems:    FileItem[];
  onThumbClick: (index: number) => void;
  isDragging:   boolean;
  onDragOver:   (e: React.DragEvent) => void;
  onDragLeave:  () => void;
  onDrop:       (e: React.DragEvent) => void;
  onClick:      () => void;
  maxFiles:     number;
}

export function MultiFileDropzone({
  fileItems, onThumbClick,
  isDragging, onDragOver, onDragLeave, onDrop, onClick, maxFiles,
}: MultiFileDropzoneProps) {
  const canAdd = fileItems.length < maxFiles;

  return (
    <div className="flex flex-col gap-4">
      {/* Drop zone — hidden when full */}
      {canAdd && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload file"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={onClick}
          onKeyDown={e => e.key === "Enter" && onClick()}
          className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl px-6 py-8 text-center transition-all duration-200"
          style={{
            background: isDragging ? "#d2e4ff40" : DS.surfaceContainerLow,
            border: `2px dashed ${isDragging ? DS.primaryContainer : DS.outlineVariant}`,
          }}
        >
          <div
            className="flex h-10 w-10 items-center justify-center rounded-2xl transition-colors"
            style={{ background: isDragging ? "#d2e4ff" : DS.surfaceContainerHighest }}
          >
            <CloudUpload className="h-5 w-5" style={{ color: isDragging ? DS.primaryContainer : DS.outline }} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: DS.onSurface }}>
              Kéo thả hoặc{" "}
              <span className="underline underline-offset-2" style={{ color: DS.primaryContainer }}>
                chọn file
              </span>
            </p>
            <p className="mt-1 text-xs" style={{ color: DS.outline }}>
              JPG, PNG, PDF · tối đa {MAX_FILE_MB}MB · {fileItems.length}/{maxFiles} file
            </p>
          </div>
        </div>
      )}

      {/* Confirmed thumbnails — click to open lightbox */}
      {fileItems.length > 0 && (
        <div className="overflow-auto rounded-2xl" style={{ maxHeight: "480px" }}>
          <div className="grid grid-cols-2 gap-2">
            {fileItems.map((item, i) => (
              <FileThumb key={i} item={item} onClick={() => onThumbClick(i)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
