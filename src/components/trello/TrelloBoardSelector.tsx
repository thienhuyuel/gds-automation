"use client";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
      <div className="flex gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-36 w-52 shrink-0 animate-pulse rounded-2xl"
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
    <ScrollArea className="w-full">
      <div className="flex gap-3 pb-3">
        {cards.map(card => (
          <TrelloCardItem
            key={card.id}
            card={card}
            isSelected={selected?.id === card.id}
            onClick={() => onSelect(selected?.id === card.id ? null : card)}
          />
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
