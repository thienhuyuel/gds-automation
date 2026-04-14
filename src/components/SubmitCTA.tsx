"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ValidationHint } from "@/components/ui/ValidationHint";
import { DS } from "@/lib/design-tokens";
import { isCasComplete, isLiveComplete } from "@/lib/trello-utils";
import type { TrelloCard, CardType, CasState, LiveState } from "@/lib/types";

interface SubmitCTAProps {
  formValid:    boolean;
  isSubmitting: boolean;
  selectedCard: TrelloCard | null;
  fileCount:    number;
  cardType:     CardType;
  casState:     CasState;
  liveState:    LiveState;
}

export function SubmitCTA({
  formValid, isSubmitting,
  selectedCard, fileCount, cardType, casState, liveState,
}: SubmitCTAProps) {
  return (
    <div className="flex flex-col gap-3">
      <Button
        type="submit"
        disabled={!formValid || isSubmitting}
        className="h-12 w-full rounded-3xl text-base font-semibold transition-all"
        style={{
          background: formValid ? DS.ctaGradient : DS.surfaceContainerHighest,
          color:      formValid ? "#fff" : DS.outline,
          boxShadow:  formValid ? DS.ambientShadow : "none",
          cursor:     formValid ? "pointer" : "not-allowed",
        }}
      >
        {isSubmitting
          ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang gửi...</>
          : "🚀 Gửi sang QA"
        }
      </Button>

      {!formValid && (
        <ul className="flex flex-col gap-1.5 px-1">
          <ValidationHint done={!!selectedCard}  label="Chọn Trello Card" />
          <ValidationHint done={fileCount > 0}   label="Upload ít nhất 1 file" />
          <ValidationHint
            done={
              cardType === "CAS"  ? isCasComplete(casState)   :
              cardType === "LIVE" ? isLiveComplete(liveState) : false
            }
            label="Hoàn thành 100% Checklist"
          />
        </ul>
      )}
    </div>
  );
}
