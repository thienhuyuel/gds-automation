import type { CasState, LiveState } from "./types";

export const MAX_FILES   = 5;
export const MAX_FILE_MB = 20;

export const DEFAULT_CAS: CasState = {
  logoStatus:   "",
  format:       false,
  quantity:     false,
  naming:       false,
  requirements: false,
};

export const DEFAULT_LIVE: LiveState = {
  pgmInfo:         "",
  sellerInfo:      "",
  useFlag:         "",
  templateApplied: false,
  naming:          false,
};
