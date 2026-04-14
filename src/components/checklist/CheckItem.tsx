"use client";

import { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DS } from "@/lib/design-tokens";

interface CheckItemProps {
  label:    string;
  checked:  boolean;
  onChange: (v: boolean) => void;
}

export function CheckItem({ label, checked, onChange }: CheckItemProps) {
  const id = useId(); // React 18 — stable, unique, collision-proof

  return (
    <div className="flex items-center gap-3 py-3">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={v => onChange(v === true)}
        className="h-5 w-5 rounded-md"
        style={
          checked
            ? { background: DS.primaryContainer, borderColor: DS.primaryContainer }
            : { borderColor: DS.outlineVariant }
        }
      />
      <Label
        htmlFor={id}
        className="cursor-pointer select-none text-sm leading-snug"
        style={{ color: DS.onSurface }}
      >
        {label}
      </Label>
    </div>
  );
}
