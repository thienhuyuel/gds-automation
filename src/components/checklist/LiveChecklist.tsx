"use client";

import { DS } from "@/lib/design-tokens";
import type { LiveState } from "@/lib/types";
import { CheckItem }  from "./CheckItem";
import { RadioYesNo } from "./RadioYesNo";

interface LiveChecklistProps {
  state:    LiveState;
  onChange: (s: LiveState) => void;
}

export function LiveChecklist({ state, onChange }: LiveChecklistProps) {
  return (
    <div className="flex flex-col divide-y" style={{ borderColor: `${DS.outlineVariant}26` }}>
      <RadioYesNo label="Thông tin PGM"    value={state.pgmInfo}    onChange={v => onChange({ ...state, pgmInfo: v })} />
      <RadioYesNo label="Thông tin Seller" value={state.sellerInfo} onChange={v => onChange({ ...state, sellerInfo: v })} />
      <RadioYesNo label="Sử dụng Flag"     value={state.useFlag}    onChange={v => onChange({ ...state, useFlag: v })} />
      <CheckItem  label="Đã áp dụng đúng Template và Yêu cầu" checked={state.templateApplied} onChange={v => onChange({ ...state, templateApplied: v })} />
      <CheckItem  label="Đã đặt tên file đúng chuẩn"          checked={state.naming}          onChange={v => onChange({ ...state, naming: v })} />
    </div>
  );
}
