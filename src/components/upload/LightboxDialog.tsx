"use client";

import { FileImage, Trash, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DSIconButton } from "@/components/ui/DSIconButton";
import { DS } from "@/lib/design-tokens";
import { fmtMB } from "@/lib/file-utils";
import type { FileItem } from "@/lib/types";

interface LightboxDialogProps {
  item:     FileItem | null;
  open:     boolean;
  onClose:  () => void;
  onDelete: () => void;
}

export function LightboxDialog({ item, open, onClose, onDelete }: LightboxDialogProps) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[95vh] flex-col gap-0 overflow-hidden rounded-3xl p-0 ring-0"
        style={{
          background: DS.onSurface,
          boxShadow:  DS.elevatedShadow,
          maxWidth:   "min(90vw, 900px)",
          fontFamily: "var(--font-inter), sans-serif",
        }}
      >
        {/* DS-styled close button */}
        <DSIconButton
          variant="dark"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute right-3 top-3 z-10"
        >
          <X className="h-4 w-4" />
        </DSIconButton>

        {/* Full image — scrollable if taller than viewport */}
        <div className="flex-1 overflow-auto">
          {item.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.previewUrl} alt={item.file.name} className="block h-auto w-full" />
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-24">
              <FileImage className="h-16 w-16" style={{ color: DS.outlineVariant }} />
              <p className="text-sm" style={{ color: DS.outline }}>{item.file.name}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex flex-col items-center gap-4 px-6 py-5"
          style={{ borderTop: `1px solid ${DS.outlineVariant}20` }}
        >
          <div className="text-center">
            <p
              className="break-all text-sm font-medium leading-snug"
              style={{ color: DS.surfaceContainerLowest }}
            >
              {item.file.name}
            </p>
            <p className="mt-0.5 text-xs" style={{ color: DS.outlineVariant }}>
              {fmtMB(item.file.size)}
            </p>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="lg"
            onClick={onDelete}
            className="w-full max-w-xs rounded-2xl text-base font-bold tracking-[-0.01em]"
          >
            <Trash className="mr-2 h-5 w-5" />
            🗑️ XÓA KHỎI DANH SÁCH
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
