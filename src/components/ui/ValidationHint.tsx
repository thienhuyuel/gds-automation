import { DS } from "@/lib/design-tokens";

interface ValidationHintProps {
  done:  boolean;
  label: string;
}

export function ValidationHint({ done, label }: ValidationHintProps) {
  return (
    <li className="flex items-center gap-2 text-xs">
      <span
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
        style={{
          background: done ? "#dcfce7" : DS.surfaceContainerHigh,
          color:      done ? "#15803d" : DS.outline,
        }}
      >
        {done ? "✓" : "·"}
      </span>
      <span style={{ color: done ? "#15803d" : DS.outline }}>{label}</span>
    </li>
  );
}
