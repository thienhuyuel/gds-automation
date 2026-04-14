"use client";

import { DS } from "@/lib/design-tokens";

interface RadioYesNoProps {
  label:    string;
  value:    "yes" | "no" | "";
  onChange: (v: "yes" | "no") => void;
  disabled?: boolean;
}

export function RadioYesNo({ label, value, onChange, disabled = false }: RadioYesNoProps) {
  return (
    <div className={`flex items-center justify-between py-3 transition-opacity ${disabled ? "opacity-40" : ""}`}>
      <span className="text-sm" style={{ color: DS.onSurface }}>{label}</span>
      <div className="flex gap-1.5">
        {(["yes", "no"] as const).map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => !disabled && onChange(opt)}
            disabled={disabled}
            className="rounded-lg px-3 py-1 text-xs font-medium transition-all duration-150 disabled:cursor-not-allowed"
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
