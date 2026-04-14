import { ButtonHTMLAttributes, forwardRef } from "react";
import { DS } from "@/lib/design-tokens";

type Variant = "surface" | "dark";

const STYLES: Record<Variant, { base: string; hover: string; color: string }> = {
  surface: {
    base:  DS.surfaceContainerHigh,
    hover: DS.surfaceContainerHighest,
    color: DS.outline,
  },
  dark: {
    base:  "rgba(255,255,255,0.10)",
    hover: "rgba(255,255,255,0.22)",
    color: DS.surfaceContainerLowest,
  },
};

interface DSIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md";
}

export const DSIconButton = forwardRef<HTMLButtonElement, DSIconButtonProps>(
  function DSIconButton({ variant = "surface", size = "md", className = "", style, ...props }, ref) {
    const s       = STYLES[variant];
    const sizeClx = size === "sm" ? "h-6 w-6" : "h-8 w-8";

    return (
      <button
        ref={ref}
        type="button"
        className={`flex shrink-0 items-center justify-center rounded-xl transition-colors disabled:opacity-40 ${sizeClx} ${className}`}
        style={{ background: s.base, color: s.color, ...style }}
        onMouseEnter={e => (e.currentTarget.style.background = s.hover)}
        onMouseLeave={e => (e.currentTarget.style.background = s.base)}
        {...props}
      />
    );
  }
);
