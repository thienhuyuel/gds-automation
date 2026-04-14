"use client";

import { DS } from "@/lib/design-tokens";
import { EtherCard } from "@/components/ui/EtherCard";
import { casProgress, liveProgress } from "@/lib/trello-utils";
import type { TrelloCard, CardType, CasState, LiveState } from "@/lib/types";
import { CasChecklist }  from "./CasChecklist";
import { LiveChecklist } from "./LiveChecklist";

interface DynamicChecklistProps {
  card:        TrelloCard | null;
  cardType:    CardType;
  casState:    CasState;
  liveState:   LiveState;
  onCasChange:  (s: CasState)  => void;
  onLiveChange: (s: LiveState) => void;
}

export function DynamicChecklist({
  card, cardType, casState, liveState, onCasChange, onLiveChange,
}: DynamicChecklistProps) {
  if (!card) {
    return (
      <div
        className="flex items-center justify-center rounded-3xl py-12 text-sm"
        style={{ background: DS.surfaceContainerLowest, boxShadow: DS.ambientShadow, color: DS.outline }}
      >
        Chọn một card để hiển thị checklist
      </div>
    );
  }

  const [done, total] = cardType === "CAS"
    ? casProgress(casState)
    : cardType === "LIVE"
    ? liveProgress(liveState)
    : [0, 0];

  const complete = done === total && total > 0;

  return (
    <EtherCard
      title={cardType ? `Checklist · ${cardType}` : "Checklist"}
      badge={total > 0 ? `${done}/${total}` : undefined}
      badgeComplete={complete}
      typeTag={cardType}
    >
      {cardType === "CAS"  && <CasChecklist  state={casState}  onChange={onCasChange}  />}
      {cardType === "LIVE" && <LiveChecklist state={liveState} onChange={onLiveChange} />}
      {!cardType && (
        <p className="py-2 text-sm" style={{ color: DS.outline }}>
          Card này không có nhãn <strong>CAS</strong> hoặc <strong>LIVE</strong>.
          Vui lòng kiểm tra lại nhãn trong Trello.
        </p>
      )}
    </EtherCard>
  );
}
