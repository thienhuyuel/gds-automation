"use client";

import { DS } from "@/lib/design-tokens";
import type { LiveState } from "@/lib/types";
import { CheckItem }  from "./CheckItem";
import { RadioYesNo } from "./RadioYesNo";

interface LiveChecklistProps {
  state:    LiveState;
  onChange: (s: LiveState) => void;
  disabled?: boolean;
}

export function LiveChecklist({ state, onChange, disabled = false }: LiveChecklistProps) {
  return (
    <div className="flex flex-col divide-y" style={{ borderColor: `${DS.outlineVariant}26` }}>
      <RadioYesNo label="Thông tin PGM"    value={state.pgmInfo}    onChange={v => onChange({ ...state, pgmInfo: v })}    disabled={disabled} />
      <RadioYesNo label="Thông tin Seller" value={state.sellerInfo} onChange={v => onChange({ ...state, sellerInfo: v })} disabled={disabled} />
      <RadioYesNo label="Sử dụng Flag"     value={state.useFlag}    onChange={v => onChange({ ...state, useFlag: v })}    disabled={disabled} />
      <CheckItem  label="Đã áp dụng đúng Template và Yêu cầu" checked={state.templateApplied} onChange={v => onChange({ ...state, templateApplied: v })} disabled={disabled} />
      <CheckItem  label="Đã đặt tên file đúng chuẩn"          checked={state.naming}          onChange={v => onChange({ ...state, naming: v })}          disabled={disabled} />
    </div>
  );
}
