"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MAX_FILES } from "@/lib/constants";
import { makeFileItems } from "@/lib/file-utils";
import type { FileItem } from "@/lib/types";

export function useFileUpload() {
  const [fileItems,    setFileItems]    = useState<FileItem[]>([]);
  const [pendingItems, setPendingItems] = useState<FileItem[]>([]);
  const [previewOpen,  setPreviewOpen]  = useState(false);
  const [lightboxIdx,  setLightboxIdx]  = useState<number | null>(null);
  const [isDragging,   setDragging]     = useState(false);

  const fileInputRef    = useRef<HTMLInputElement>(null);
  const pendingInputRef = useRef<HTMLInputElement>(null);

  // Keep a ref in sync for cleanup on unmount without stale closure
  const fileItemsRef = useRef(fileItems);
  useEffect(() => { fileItemsRef.current = fileItems; }, [fileItems]);

  useEffect(() => {
    return () => {
      fileItemsRef.current.forEach(i => {
        if (i.previewUrl) URL.revokeObjectURL(i.previewUrl);
      });
    };
  }, []);

  // ── Pending file operations ──────────────────────────────────────────────

  function addToPending(incoming: File[]) {
    const currentTotal = fileItems.length + pendingItems.length;
    const { items, rejected, overflow } = makeFileItems(incoming, currentTotal);
    if (rejected) toast.error(`${rejected} file vượt quá giới hạn dung lượng.`);
    if (overflow) toast.error(`Chỉ thêm được ${MAX_FILES - currentTotal} file nữa (tối đa ${MAX_FILES}).`);
    if (!items.length) return;
    setPendingItems(prev => [...prev, ...items]);
    setPreviewOpen(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function addMoreToPending(incoming: File[]) {
    const currentTotal = fileItems.length + pendingItems.length;
    const { items, rejected, overflow } = makeFileItems(incoming, currentTotal);
    if (rejected) toast.error(`${rejected} file vượt quá giới hạn dung lượng.`);
    if (overflow) toast.error(`Tối đa ${MAX_FILES} file tổng cộng.`);
    if (items.length) setPendingItems(prev => [...prev, ...items]);
    if (pendingInputRef.current) pendingInputRef.current.value = "";
  }

  function removePending(index: number) {
    setPendingItems(prev => {
      const item = prev[index];
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  function cancelPending() {
    pendingItems.forEach(i => { if (i.previewUrl) URL.revokeObjectURL(i.previewUrl); });
    setPendingItems([]);
    setPreviewOpen(false);
  }

  function confirmPending() {
    setFileItems(prev => [...prev, ...pendingItems]);
    setPendingItems([]);
    setPreviewOpen(false);
  }

  // ── Confirmed file operations ────────────────────────────────────────────

  function removeFile(index: number) {
    setFileItems(prev => {
      const item = prev[index];
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  function resetAll() {
    fileItemsRef.current.forEach(i => { if (i.previewUrl) URL.revokeObjectURL(i.previewUrl); });
    setFileItems([]);
    setPendingItems([]);
    setPreviewOpen(false);
    setLightboxIdx(null);
  }

  // ── Lightbox ─────────────────────────────────────────────────────────────

  function openLightbox(index: number) { setLightboxIdx(index); }
  function closeLightbox()             { setLightboxIdx(null); }
  function removeFromLightbox() {
    if (lightboxIdx === null) return;
    removeFile(lightboxIdx);
    setLightboxIdx(null);
  }

  // ── Drag & Drop ──────────────────────────────────────────────────────────

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    addToPending(Array.from(e.dataTransfer.files));
  }

  // ── File picker triggers ─────────────────────────────────────────────────

  const openFilePicker    = () => fileInputRef.current?.click();
  const openPendingPicker = () => pendingInputRef.current?.click();

  return {
    // State
    fileItems, pendingItems, previewOpen, lightboxIdx, isDragging,
    // Refs (for hidden input elements rendered in UploadSection)
    fileInputRef, pendingInputRef,
    // Pending handlers
    addToPending, addMoreToPending, removePending, cancelPending, confirmPending,
    // Confirmed handlers
    removeFile, resetAll,
    // Lightbox handlers
    openLightbox, closeLightbox, removeFromLightbox,
    // Drag handlers
    handleDrop, setDragging,
    // Picker triggers
    openFilePicker, openPendingPicker,
  };
}

export type UseFileUploadReturn = ReturnType<typeof useFileUpload>;
