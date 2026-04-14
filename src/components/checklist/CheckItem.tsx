"use client";

import { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DS } from "@/lib/design-tokens";

interface CheckItemProps {
  label:    string;
  checked:  boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

export function CheckItem({ label, checked, onChange, disabled = false }: CheckItemProps) {
  const id = useId();

  return (
    <div className={`flex items-center gap-3 py-3 transition-opacity ${disabled ? "opacity-40" : ""}`}>
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={v => onChange(v === true)}
        disabled={disabled}
        className="h-5 w-5 rounded-md"
        style={
          checked
            ? { background: DS.primaryContainer, borderColor: DS.primaryContainer }
            : { borderColor: DS.outlineVariant }
        }
      />
      <Label
        htmlFor={id}
        className={`select-none text-sm leading-snug ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
        style={{ color: DS.onSurface }}
      >
        {label}
      </Label>
    </div>
  );
}
