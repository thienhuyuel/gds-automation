"use client";

import { FileImage, ZoomIn } from "lucide-react";
import { DS } from "@/lib/design-tokens";
import { fmtMB } from "@/lib/file-utils";
import type { FileItem } from "@/lib/types";

interface FileThumbProps {
  item:    FileItem;
  onClick: () => void;
}

export function FileThumb({ item, onClick }: FileThumbProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Xem phóng to"
      className="group relative w-full overflow-hidden rounded-2xl text-left transition-shadow duration-150 focus-visible:outline-none"
      style={{ background: DS.surfaceContainerLow }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = DS.elevatedShadow)}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
    >
      {item.previewUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.previewUrl} alt={item.file.name} className="block h-auto w-full" />

          {/* Zoom hint + name overlay on hover */}
          <div className="absolute inset-0 flex flex-col justify-between bg-black/40 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            <div className="flex justify-end p-2">
              <ZoomIn className="h-4 w-4 text-white drop-shadow" />
            </div>
            <div className="px-2.5 pb-2.5">
              <p className="break-all text-xs leading-snug text-white">{item.file.name}</p>
              <p className="text-xs text-white/60">{fmtMB(item.file.size)}</p>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-8">
          <FileImage className="h-8 w-8" style={{ color: DS.outline }} />
          <div className="w-full text-center">
            <p className="break-all text-xs font-medium leading-snug" style={{ color: DS.onSurface }}>
              {item.file.name}
            </p>
            <p className="mt-0.5 text-xs" style={{ color: DS.outlineVariant }}>
              {fmtMB(item.file.size)}
            </p>
          </div>
          <span className="flex items-center gap-1 text-xs" style={{ color: DS.outline }}>
            <ZoomIn className="h-3 w-3" /> Xem chi tiết
          </span>
        </div>
      )}
    </button>
  );
}
