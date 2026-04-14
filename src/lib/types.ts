export interface TrelloLabel  { id: string; name: string; color: string }
export interface TrelloMember { id: string; fullName: string; initials: string; avatarHash: string | null }
export interface TrelloCard   {
  id:      string;
  name:    string;
  idList:  string;
  labels:  TrelloLabel[];
  due:     string | null;
  members: TrelloMember[];
}
export interface TrelloList { id: string; name: string }
export interface BoardData  { cards: TrelloCard[]; lists: TrelloList[] }
export interface FileItem   { file: File; previewUrl: string | null }

export type CardType = "CAS" | "LIVE" | null;

/** CAS Checklist — 1 radio + 4 checkboxes */
export interface CasState {
  logoStatus:   "yes" | "no" | "";
  format:       boolean;
  quantity:     boolean;
  naming:       boolean;
  requirements: boolean;
}

/** LIVE Checklist — 3 radios + 2 checkboxes */
export interface LiveState {
  pgmInfo:         "yes" | "no" | "";
  sellerInfo:      "yes" | "no" | "";
  useFlag:         "yes" | "no" | "";
  templateApplied: boolean;
  naming:          boolean;
}
