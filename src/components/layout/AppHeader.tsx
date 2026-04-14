"use client";

import { AlertCircle, Loader2, RotateCcw } from "lucide-react";
import { DS } from "@/lib/design-tokens";

interface AppHeaderProps {
  isFetching:  boolean;
  boardError:  string | null;
  cardCount?:  number;
  onRetry:     () => void;
}

export function AppHeader({ isFetching, boardError, cardCount, onRetry }: AppHeaderProps) {
  return (
    <>
      <header className="sticky top-0 z-10 backdrop-blur-md" style={{ background: `${DS.surface}cc` }}>
        <div className="mx-auto flex h-16 max-w-5xl items-center px-8">
          <div className="flex items-center gap-4">
            <h1
              className="text-xl font-semibold tracking-[-0.02em]"
              style={{ color: DS.onSurface, fontFamily: "var(--font-manrope), sans-serif" }}
            >
              Automation Control
            </h1>
            <div className="h-6 w-px" style={{ background: DS.surfaceContainerHighest }} />
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: DS.outline }}>
              Trello → QA Workflow
            </span>
          </div>

          <div className="ml-auto text-xs">
            {isFetching && (
              <span className="flex items-center gap-1.5" style={{ color: DS.outline }}>
                <Loader2 className="h-3 w-3 animate-spin" /> Đang tải Trello...
              </span>
            )}
            {boardError && !isFetching && (
              <button
                onClick={onRetry}
                className="flex items-center gap-1.5 rounded-full px-3 py-1 font-medium"
                style={{ background: "#fde8e8", color: "#c0392b" }}
              >
                <AlertCircle className="h-3 w-3" /> Lỗi kết nối <RotateCcw className="h-3 w-3" />
              </button>
            )}
            {cardCount !== undefined && !isFetching && !boardError && (
              <span className="flex items-center gap-1.5" style={{ color: DS.primaryContainer }}>
                {cardCount} cards
              </span>
            )}
          </div>
        </div>
      </header>

      {boardError && (
        <div style={{ background: "#fff5f5" }}>
          <div className="mx-auto flex max-w-5xl items-start gap-3 px-8 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <div className="flex-1 text-sm text-red-700">
              <p className="font-medium">{boardError}</p>
              <p className="mt-0.5 text-xs text-red-500">
                Kiểm tra{" "}
                <code className="rounded bg-red-100 px-1">TRELLO_API_KEY</code>,{" "}
                <code className="rounded bg-red-100 px-1">TRELLO_TOKEN</code>,{" "}
                <code className="rounded bg-red-100 px-1">TRELLO_BOARD_ID</code>{" "}
                trong <code className="rounded bg-red-100 px-1">.env.local</code>
              </p>
            </div>
            <button
              onClick={onRetry}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
              style={{ background: DS.surfaceContainerLowest }}
            >
              <RotateCcw className="h-3.5 w-3.5" /> Thử lại
            </button>
          </div>
        </div>
      )}
    </>
  );
}
