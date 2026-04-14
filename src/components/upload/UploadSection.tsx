"use client";

import { EtherCard }         from "@/components/ui/EtherCard";
import { MAX_FILES }         from "@/lib/constants";
import type { UseFileUploadReturn } from "@/hooks/useFileUpload";
import { MultiFileDropzone } from "./MultiFileDropzone";

interface UploadSectionProps {
  upload: UseFileUploadReturn;
}

export function UploadSection({ upload }: UploadSectionProps) {
  const {
    fileItems, openLightbox, isDragging, setDragging,
    handleDrop, openFilePicker, addToPending, addMoreToPending,
    fileInputRef, pendingInputRef,
  } = upload;

  return (
    <EtherCard
      title="Đính kèm File"
      badge={fileItems.length > 0 ? `${fileItems.length}/${MAX_FILES}` : undefined}
    >
      <MultiFileDropzone
        fileItems={fileItems}
        onThumbClick={openLightbox}
        isDragging={isDragging}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={openFilePicker}
        maxFiles={MAX_FILES}
      />

      {/* Hidden file inputs — triggered programmatically */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.pdf"
        className="hidden"
        onChange={e => addToPending(Array.from(e.target.files ?? []))}
      />
      <input
        ref={pendingInputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.pdf"
        className="hidden"
        onChange={e => addMoreToPending(Array.from(e.target.files ?? []))}
      />
    </EtherCard>
  );
}
