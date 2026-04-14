"use client";

import { DS } from "@/lib/design-tokens";
import type { TrelloCard } from "@/lib/types";
import { TrelloCardItem } from "./TrelloCardItem";

interface TrelloBoardSelectorProps {
  cards:    TrelloCard[];
  selected: TrelloCard | null;
  onSelect: (card: TrelloCard | null) => void;
  loading:  boolean;
}

export function TrelloBoardSelector({ cards, selected, onSelect, loading }: TrelloBoardSelectorProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-28 w-full animate-pulse rounded-2xl"
            style={{ background: DS.surfaceContainerLow }}
          />
        ))}
      </div>
    );
  }

  if (!cards.length) {
    return (
      <p className="py-4 text-sm" style={{ color: DS.outline }}>
        Không có card nào trong list này.
      </p>
    );
  }

  return (
    /* Native overflow-y-auto — ScrollArea viewport không nhận max-height từ style */
    <div className="max-h-[560px] overflow-y-auto">
      <div className="flex flex-col gap-2 pr-0.5">
        {cards.map(card => (
          <TrelloCardItem
            key={card.id}
            card={card}
            isSelected={selected?.id === card.id}
            onClick={() => onSelect(selected?.id === card.id ? null : card)}
          />
        ))}
      </div>
    </div>
  );
}
