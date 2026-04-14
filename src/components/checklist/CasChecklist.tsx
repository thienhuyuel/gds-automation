"use client";

import { DS } from "@/lib/design-tokens";
import type { CasState } from "@/lib/types";
import { CheckItem }   from "./CheckItem";
import { RadioYesNo }  from "./RadioYesNo";

interface CasChecklistProps {
  state:    CasState;
  onChange: (s: CasState) => void;
}

export function CasChecklist({ state, onChange }: CasChecklistProps) {
  return (
    <div className="flex flex-col divide-y" style={{ borderColor: `${DS.outlineVariant}26` }}>
      <RadioYesNo
        label="Tình trạng Logo"
        value={state.logoStatus}
        onChange={v => onChange({ ...state, logoStatus: v })}
      />
      <CheckItem label="Đã xuất đúng định dạng (Type)"      checked={state.format}       onChange={v => onChange({ ...state, format: v })} />
      <CheckItem label="Đã đủ số lượng banner theo yêu cầu" checked={state.quantity}     onChange={v => onChange({ ...state, quantity: v })} />
      <CheckItem label="Đã đặt tên file đúng chuẩn"         checked={state.naming}       onChange={v => onChange({ ...state, naming: v })} />
      <CheckItem label="Đã đáp ứng đúng yêu cầu của Request" checked={state.requirements} onChange={v => onChange({ ...state, requirements: v })} />
    </div>
  );
}
