"use client";

import { DS } from "@/lib/design-tokens";

interface RadioYesNoProps {
  label:    string;
  value:    "yes" | "no" | "";
  onChange: (v: "yes" | "no") => void;
}

export function RadioYesNo({ label, value, onChange }: RadioYesNoProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm" style={{ color: DS.onSurface }}>{label}</span>
      <div className="flex gap-1.5">
        {(["yes", "no"] as const).map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className="rounded-lg px-3 py-1 text-xs font-medium transition-all duration-150"
            style={{
              background: value === opt
                ? (opt === "yes" ? DS.primaryContainer : DS.onSurface)
                : DS.surfaceContainerLow,
              color: value === opt ? "#fff" : DS.outline,
            }}
          >
            {opt === "yes" ? "Có" : "Không"}
          </button>
        ))}
      </div>
    </div>
  );
}
