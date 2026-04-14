import { ReactNode } from "react";
import { DS } from "@/lib/design-tokens";
import type { CardType } from "@/lib/types";

interface EtherCardProps {
  title?:         string;
  badge?:         string;
  badgeComplete?: boolean;
  typeTag?:       CardType;
  headerEnd?:     ReactNode;
  children:       ReactNode;
}

export function EtherCard({
  title, badge, badgeComplete = false, typeTag, headerEnd, children,
}: EtherCardProps) {
  return (
    <section
      className="rounded-3xl p-8"
      style={{ background: DS.surfaceContainerLowest, boxShadow: DS.ambientShadow }}
    >
      <div className="mb-6 flex items-center gap-3">
        {title && (
          <h2
            className="text-sm font-semibold tracking-[-0.01em]"
            style={{ color: DS.onSurface, fontFamily: "var(--font-manrope), sans-serif" }}
          >
            {title}
          </h2>
        )}

        {typeTag && (
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={
              typeTag === "CAS"
                ? { background: "#dbeafe", color: DS.primary }
                : { background: "#fde8cc", color: DS.tertiary }
            }
          >
            {typeTag}
          </span>
        )}

        {badge && (
          <span
            className="rounded-full px-3 py-0.5 text-xs font-medium transition-colors"
            style={{
              background: badgeComplete ? "#dcfce7" : DS.surfaceContainerHigh,
              color:      badgeComplete ? "#15803d"  : DS.outline,
            }}
          >
            {badge}
          </span>
        )}

        <div className="ml-auto">{headerEnd}</div>
      </div>

      {children}
    </section>
  );
}
