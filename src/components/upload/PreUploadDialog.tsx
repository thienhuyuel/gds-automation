"use client";

import { FileImage, Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DSIconButton } from "@/components/ui/DSIconButton";
import { DS } from "@/lib/design-tokens";
import { MAX_FILES } from "@/lib/constants";
import { fmtMB } from "@/lib/file-utils";
import type { FileItem } from "@/lib/types";

interface PreUploadDialogProps {
  pendingItems:   FileItem[];
  confirmedCount: number;
  open:           boolean;
  onRemove:       (i: number) => void;
  onAddMore:      () => void;
  onCancel:       () => void;
  onConfirm:      () => void;
}

export function PreUploadDialog({
  pendingItems, confirmedCount, open, onRemove, onAddMore, onCancel, onConfirm,
}: PreUploadDialogProps) {
  const totalAfter = confirmedCount + pendingItems.length;
  const canAddMore = totalAfter < MAX_FILES;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onCancel(); }}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[90vh] flex-col gap-0 overflow-hidden rounded-3xl p-0 ring-0"
        style={{
          background: DS.surfaceContainerLowest,
          boxShadow:  DS.elevatedShadow,
          maxWidth:   520,
          fontFamily: "var(--font-inter), sans-serif",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div>
            <DialogTitle
              className="text-base font-semibold tracking-[-0.01em]"
              style={{ color: DS.onSurface, fontFamily: "var(--font-manrope), sans-serif" }}
            >
              Xác nhận file tải lên
            </DialogTitle>
            <p className="mt-1 text-xs" style={{ color: DS.outline }}>
              {pendingItems.length} file đang chờ · Tổng sau khi xác nhận:{" "}
              <strong style={{ color: DS.onSurface }}>{totalAfter}/{MAX_FILES}</strong>
            </p>
          </div>
          <DSIconButton onClick={onCancel} aria-label="Đóng">
            <X className="h-4 w-4" />
          </DSIconButton>
        </div>

        {/* Pending thumbnails */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          <div className="grid grid-cols-2 gap-3">
            {pendingItems.map((item, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-2xl"
                style={{ background: DS.surfaceContainerLow }}
              >
                {item.previewUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.previewUrl} alt={item.file.name} className="block h-auto w-full" />
                    <div className="absolute inset-x-0 bottom-0 bg-black/55 px-2.5 py-2">
                      <p className="break-all text-xs leading-snug text-white">{item.file.name}</p>
                      <p className="text-xs text-white/55">{fmtMB(item.file.size)}</p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 px-4 py-8">
                    <FileImage className="h-7 w-7" style={{ color: DS.outline }} />
                    <p className="break-all text-center text-xs leading-snug" style={{ color: DS.onSurface }}>
                      {item.file.name}
                    </p>
                    <p className="text-xs" style={{ color: DS.outlineVariant }}>{fmtMB(item.file.size)}</p>
                  </div>
                )}

                {/* Remove button */}
                <DSIconButton
                  size="sm"
                  onClick={() => onRemove(i)}
                  aria-label="Xóa file"
                  className="absolute right-2 top-2"
                  onMouseEnter={e => (e.currentTarget.style.background = "#fde8e8")}
                  onMouseLeave={e => (e.currentTarget.style.background = DS.surfaceContainerLowest)}
                  style={{ background: DS.surfaceContainerLowest, color: DS.onSurface }}
                >
                  <X className="h-3.5 w-3.5" />
                </DSIconButton>
              </div>
            ))}

            {/* "Thêm file" card */}
            {canAddMore && (
              <button
                type="button"
                onClick={onAddMore}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl py-10 transition-all duration-150"
                style={{ border: `2px dashed ${DS.outlineVariant}`, color: DS.outline }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.borderColor = DS.primaryContainer;
                  el.style.color       = DS.primaryContainer;
                  el.style.background  = "#d2e4ff30";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.borderColor = DS.outlineVariant;
                  el.style.color       = DS.outline;
                  el.style.background  = "transparent";
                }}
              >
                <Plus className="h-5 w-5" />
                <span className="text-xs font-medium">Thêm file</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4" style={{ borderTop: `1px solid ${DS.outlineVariant}40` }}>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-2xl py-2.5 text-sm font-medium transition-colors"
            style={{ background: DS.surfaceContainerHigh, color: DS.outline }}
            onMouseEnter={e => (e.currentTarget.style.background = DS.surfaceContainerHighest)}
            onMouseLeave={e => (e.currentTarget.style.background = DS.surfaceContainerHigh)}
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pendingItems.length === 0}
            className="flex-1 rounded-2xl py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
            style={{ background: DS.ctaGradient }}
          >
            Xác nhận & Tải lên
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
