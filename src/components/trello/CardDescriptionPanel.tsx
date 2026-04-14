"use client";

import { DS } from "@/lib/design-tokens";
import { EtherCard } from "@/components/ui/EtherCard";
import type { TrelloCard } from "@/lib/types";

interface CardDescriptionPanelProps {
  card: TrelloCard;
}

export function CardDescriptionPanel({ card }: CardDescriptionPanelProps) {
  return (
    <EtherCard title="Mô tả">
      {card.desc.trim() ? (
        <p
          className="text-sm leading-relaxed whitespace-pre-wrap"
          style={{ color: DS.onSurface }}
        >
          {card.desc}
        </p>
      ) : (
        <p className="text-sm italic" style={{ color: DS.outline }}>
          Không có mô tả.
        </p>
      )}
    </EtherCard>
  );
}
