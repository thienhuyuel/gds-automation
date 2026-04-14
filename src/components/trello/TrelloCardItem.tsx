"use client";

import { Calendar } from "lucide-react";
import { DS } from "@/lib/design-tokens";
import { TRELLO_CHIP, memberColor } from "@/lib/trello-utils";
import { fmtDue } from "@/lib/file-utils";
import type { TrelloCard } from "@/lib/types";

interface TrelloCardItemProps {
  card:       TrelloCard;
  isSelected: boolean;
  onClick:    () => void;
}

export function TrelloCardItem({ card, isSelected, onClick }: TrelloCardItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-52 shrink-0 rounded-2xl p-4 text-left transition-all duration-200 focus-visible:outline-none"
      style={{
        background: DS.surfaceContainerLowest,
        boxShadow:  isSelected ? DS.elevatedShadow : DS.ambientShadow,
        border:     `2px solid ${isSelected ? DS.primaryContainer : DS.outlineVariant}`,
      }}
      onMouseEnter={e => {
        if (!isSelected) (e.currentTarget as HTMLButtonElement).style.boxShadow = DS.elevatedShadow;
      }}
      onMouseLeave={e => {
        if (!isSelected) (e.currentTarget as HTMLButtonElement).style.boxShadow = DS.ambientShadow;
      }}
    >
      {/* Labels */}
      <div className="mb-3 flex flex-wrap gap-1">
        {card.labels.length > 0 ? (
          card.labels.map(l => {
            const chip = TRELLO_CHIP[l.color] ?? TRELLO_CHIP.black;
            return (
              <span
                key={l.id}
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none"
                style={{ background: chip.bg, color: chip.text }}
              >
                {l.name || l.color}
              </span>
            );
          })
        ) : (
          <span className="text-[10px]" style={{ color: DS.outlineVariant }}>—</span>
        )}
      </div>

      {/* Title — 2-line clamp */}
      <p
        className="mb-4 line-clamp-2 text-sm font-semibold leading-snug"
        style={{ color: DS.onSurface, fontFamily: "var(--font-manrope), sans-serif" }}
      >
        {card.name}
      </p>

      {/* Footer: due date + avatars */}
      <div className="flex items-center justify-between gap-2">
        {card.due ? (
          <div className="flex items-center gap-1" style={{ color: DS.outline }}>
            <Calendar className="h-3 w-3 shrink-0" />
            <span className="text-[11px]">{fmtDue(card.due)}</span>
          </div>
        ) : <span />}

        {card.members.length > 0 && (
          <div className="flex -space-x-1.5">
            {card.members.slice(0, 3).map(m => (
              <div
                key={m.id}
                title={m.fullName}
                className="flex h-6 w-6 items-center justify-center rounded-full border-2 text-[9px] font-bold text-white"
                style={{ background: memberColor(m.id), borderColor: DS.surfaceContainerLowest }}
              >
                {m.initials}
              </div>
            ))}
            {card.members.length > 3 && (
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full border-2 text-[9px] font-semibold"
                style={{
                  background:  DS.surfaceContainerHigh,
                  borderColor: DS.surfaceContainerLowest,
                  color:       DS.outline,
                }}
              >
                +{card.members.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
