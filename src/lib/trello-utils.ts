import type { TrelloCard, CasState, LiveState, CardType, FileItem } from "./types";

// ─── Card Type Detection ────────────────────────────────────────────────────

export function getCardType(card: TrelloCard): CardType {
  const names = card.labels.map(l => l.name.toUpperCase());
  if (names.some(n => n.includes("CAS")))  return "CAS";
  if (names.some(n => n.includes("LIVE"))) return "LIVE";
  return null;
}

// ─── Checklist Completion ───────────────────────────────────────────────────

export function isCasComplete(s: CasState): boolean {
  return !!s.logoStatus && s.format && s.quantity && s.naming && s.requirements;
}

export function isLiveComplete(s: LiveState): boolean {
  return !!s.pgmInfo && !!s.sellerInfo && !!s.useFlag && s.templateApplied && s.naming;
}

export function casProgress(s: CasState): [number, number] {
  return [
    [s.logoStatus, s.format, s.quantity, s.naming, s.requirements].filter(Boolean).length,
    5,
  ];
}

export function liveProgress(s: LiveState): [number, number] {
  return [
    [s.pgmInfo, s.sellerInfo, s.useFlag, s.templateApplied, s.naming].filter(Boolean).length,
    5,
  ];
}

export function isFormValid(
  card: TrelloCard | null,
  cardType: CardType,
  files: FileItem[],
  cas: CasState,
  live: LiveState,
): boolean {
  if (!card || files.length === 0) return false;
  if (cardType === "CAS")  return isCasComplete(cas);
  if (cardType === "LIVE") return isLiveComplete(live);
  return false;
}

// ─── Label Chip Colors ──────────────────────────────────────────────────────

export const TRELLO_CHIP: Record<string, { bg: string; text: string }> = {
  green:  { bg: "#dcfce7", text: "#166534" },
  sky:    { bg: "#e0f2fe", text: "#075985" },
  lime:   { bg: "#ecfccb", text: "#3a5a0a" },
  yellow: { bg: "#fef9c3", text: "#713f12" },
  orange: { bg: "#ffedd5", text: "#9a3412" },
  red:    { bg: "#fee2e2", text: "#991b1b" },
  purple: { bg: "#f3e8ff", text: "#6b21a8" },
  pink:   { bg: "#fce7f3", text: "#9d174d" },
  blue:   { bg: "#dbeafe", text: "#1e40af" },
  black:  { bg: "#e5e7eb", text: "#374151" },
};

// ─── Member Avatar Color ────────────────────────────────────────────────────

const MEMBER_PALETTE = [
  "#0067b1", "#16a34a", "#9333ea", "#ea580c",
  "#db2777", "#0284c7", "#0d9488", "#d97706",
];

export function memberColor(id: string): string {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xff;
  return MEMBER_PALETTE[h % MEMBER_PALETTE.length];
}
