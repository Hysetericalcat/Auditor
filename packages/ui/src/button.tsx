"use client";

import React, { forwardRef, CSSProperties } from "react";

// ─────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────

export type ButtonVariant =
  | "primary"    // Filled teal — primary action
  | "secondary"  // Outlined teal — secondary action
  | "danger"     // Filled red — destructive
  | "warning"    // Filled amber — caution
  | "ghost"      // No fill, subtle hover — tertiary
  | "outline"    // Outlined slate — neutral
  | "success";   // Filled green — confirm

export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

export type ButtonShape = "default" | "pill" | "square";

export interface ButtonDimensions {
  /** Override width (e.g. "100%", "200px") */
  width?: CSSProperties["width"];
  /** Override height (e.g. "48px") */
  height?: CSSProperties["height"];
  /** Override min-width */
  minWidth?: CSSProperties["minWidth"];
  /** Override padding inline */
  paddingX?: number | string;
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  /** Leading icon — any ReactNode */
  iconLeft?: React.ReactNode;
  /** Trailing icon — any ReactNode */
  iconRight?: React.ReactNode;
  /** Show a loading spinner and disable interaction */
  loading?: boolean;
  /** Stretch to fill parent width */
  fullWidth?: boolean;
  /** Dimension overrides — when you need custom sizing */
  dimensions?: ButtonDimensions;
  /** Elevate with matching glow shadow */
  glow?: boolean;
}

// ─────────────────────────────────────────────────────────────
//  TOKENS
// ─────────────────────────────────────────────────────────────

const SIZE_MAP: Record<
  ButtonSize,
  { height: number; paddingX: number; fontSize: number; iconSize: number; gap: number }
> = {
  xs: { height: 26,  paddingX: 8,  fontSize: 10, iconSize: 10, gap: 4 },
  sm: { height: 32,  paddingX: 12, fontSize: 11, iconSize: 12, gap: 5 },
  md: { height: 40,  paddingX: 16, fontSize: 12, iconSize: 14, gap: 6 },
  lg: { height: 48,  paddingX: 22, fontSize: 13, iconSize: 15, gap: 7 },
  xl: { height: 56,  paddingX: 28, fontSize: 14, iconSize: 16, gap: 8 },
};

const VARIANT_MAP: Record<
  ButtonVariant,
  {
    bg: string; bgHover: string; bgActive: string;
    color: string;
    border: string; borderHover: string;
    shadow?: string;
  }
> = {
  primary: {
    bg:          "linear-gradient(135deg, #00C4B8, #00AFA4)",
    bgHover:     "linear-gradient(135deg, #30D4CA, #00C4B8)",
    bgActive:    "linear-gradient(135deg, #008E85, #00AFA4)",
    color:       "#040810",
    border:      "transparent",
    borderHover: "transparent",
    shadow:      "0 0 20px rgba(0,196,184,0.3), 0 2px 8px rgba(0,196,184,0.2)",
  },
  secondary: {
    bg:          "rgba(0,196,184,0.08)",
    bgHover:     "rgba(0,196,184,0.15)",
    bgActive:    "rgba(0,196,184,0.2)",
    color:       "#00C4B8",
    border:      "rgba(0,196,184,0.35)",
    borderHover: "rgba(0,196,184,0.6)",
  },
  danger: {
    bg:          "linear-gradient(135deg, #EF4444, #D42020)",
    bgHover:     "linear-gradient(135deg, #F77171, #EF4444)",
    bgActive:    "linear-gradient(135deg, #AA1010, #D42020)",
    color:       "#fff",
    border:      "transparent",
    borderHover: "transparent",
    shadow:      "0 0 20px rgba(239,68,68,0.3)",
  },
  warning: {
    bg:          "rgba(245,168,0,0.12)",
    bgHover:     "rgba(245,168,0,0.2)",
    bgActive:    "rgba(245,168,0,0.28)",
    color:       "#F5A800",
    border:      "rgba(245,168,0,0.35)",
    borderHover: "rgba(245,168,0,0.6)",
  },
  ghost: {
    bg:          "transparent",
    bgHover:     "rgba(107,132,166,0.1)",
    bgActive:    "rgba(107,132,166,0.18)",
    color:       "#8DA0BE",
    border:      "transparent",
    borderHover: "rgba(107,132,166,0.25)",
  },
  outline: {
    bg:          "transparent",
    bgHover:     "rgba(107,132,166,0.08)",
    bgActive:    "rgba(107,132,166,0.15)",
    color:       "#C8D5E8",
    border:      "rgba(107,132,166,0.3)",
    borderHover: "rgba(107,132,166,0.55)",
  },
  success: {
    bg:          "linear-gradient(135deg, #22B567, #129A51)",
    bgHover:     "linear-gradient(135deg, #52CC8A, #22B567)",
    bgActive:    "linear-gradient(135deg, #0A7A3D, #129A51)",
    color:       "#040810",
    border:      "transparent",
    borderHover: "transparent",
    shadow:      "0 0 20px rgba(34,181,103,0.3)",
  },
};

const RADIUS_MAP: Record<ButtonShape, string> = {
  default: "4px",
  pill:    "9999px",
  square:  "0px",
};

// ─────────────────────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────────────────────

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      shape = "default",
      iconLeft,
      iconRight,
      loading = false,
      fullWidth = false,
      dimensions,
      glow = false,
      children,
      disabled,
      style,
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onMouseUp,
      ...rest
    },
    ref
  ) => {
    const [hovered, setHovered] = React.useState(false);
    const [active,  setActive]  = React.useState(false);

    const sz  = SIZE_MAP[size];
    const vr  = VARIANT_MAP[variant];
    const isDisabled = disabled || loading;

    const resolvedBg =
      active  ? vr.bgActive  :
      hovered ? vr.bgHover   : vr.bg;

    const resolvedBorder =
      hovered ? vr.borderHover : vr.border;

    const computedStyle: CSSProperties = {
      // Layout
      display:        "inline-flex",
      alignItems:     "center",
      justifyContent: "center",
      gap:            sz.gap,
      width:          dimensions?.width  ?? (fullWidth ? "100%" : "auto"),
      height:         dimensions?.height ?? sz.height,
      minWidth:       dimensions?.minWidth,
      paddingLeft:    dimensions?.paddingX ?? sz.paddingX,
      paddingRight:   dimensions?.paddingX ?? sz.paddingX,
      flexShrink:     0,
      // Appearance
      background:     isDisabled ? "rgba(19,30,51,0.6)" : resolvedBg,
      color:          isDisabled ? "rgba(107,132,166,0.4)" : vr.color,
      border:         `1px solid ${isDisabled ? "rgba(107,132,166,0.1)" : resolvedBorder}`,
      borderRadius:   RADIUS_MAP[shape],
      // Typography
      fontFamily:     "'IBM Plex Mono', monospace",
      fontSize:       sz.fontSize,
      fontWeight:     600,
      letterSpacing:  "0.04em",
      textTransform:  "uppercase" as const,
      whiteSpace:     "nowrap" as const,
      // Interaction
      cursor:    isDisabled ? "not-allowed" : "pointer",
      opacity:   isDisabled ? 0.5 : 1,
      outline:   "none",
      // Shadow
      boxShadow:
        isDisabled ? "none"
        : glow && vr.shadow && hovered ? vr.shadow
        : "none",
      // Transition
      transition:
        "background 0.15s ease, border-color 0.15s ease, box-shadow 0.2s ease, opacity 0.15s ease, transform 0.1s ease",
      transform: active && !isDisabled ? "scale(0.98)" : "scale(1)",
      // User select
      userSelect: "none",
      ...style,
    };

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        style={computedStyle}
        onMouseEnter={e => { setHovered(true);  onMouseEnter?.(e); }}
        onMouseLeave={e => { setHovered(false); setActive(false); onMouseLeave?.(e); }}
        onMouseDown={e =>  { setActive(true);   onMouseDown?.(e); }}
        onMouseUp={e =>    { setActive(false);  onMouseUp?.(e); }}
        {...rest}
      >
        {loading ? (
          <Spinner size={sz.iconSize} color={vr.color} />
        ) : (
          iconLeft && (
            <span style={{ display: "flex", alignItems: "center", fontSize: sz.iconSize }}>
              {iconLeft}
            </span>
          )
        )}

        {children && (
          <span style={{ lineHeight: 1 }}>{children}</span>
        )}

        {!loading && iconRight && (
          <span style={{ display: "flex", alignItems: "center", fontSize: sz.iconSize }}>
            {iconRight}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

// ─────────────────────────────────────────────────────────────
//  SPINNER
// ─────────────────────────────────────────────────────────────

function Spinner({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      style={{
        animation: "pharma-spin 0.7s linear infinite",
      }}
    >
      <style>{`@keyframes pharma-spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
//  BUTTON GROUP — layout helper
// ─────────────────────────────────────────────────────────────

export interface ButtonGroupProps {
  children: React.ReactNode;
  /** Stack direction */
  direction?: "row" | "column";
  gap?: number;
  style?: CSSProperties;
}

export function ButtonGroup({
  children,
  direction = "row",
  gap = 8,
  style,
}: ButtonGroupProps) {
  return (
    <div
      style={{
        display:       "flex",
        flexDirection: direction,
        gap,
        flexWrap:      direction === "row" ? "wrap" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  ICON BUTTON — square icon-only variant
// ─────────────────────────────────────────────────────────────

export interface IconButtonProps
  extends Omit<ButtonProps, "iconLeft" | "iconRight" | "fullWidth" | "children"> {
  icon: React.ReactNode;
  /** Accessible label */
  "aria-label": string;
}

export function IconButton({ icon, size = "md", shape = "default", ...rest }: IconButtonProps) {
  const sz = SIZE_MAP[size];
  return (
    <Button
      size={size}
      shape={shape}
      dimensions={{ width: sz.height, height: sz.height, paddingX: 0 }}
      {...rest}
    >
      <span style={{ display: "flex", alignItems: "center", fontSize: sz.iconSize }}>
        {icon}
      </span>
    </Button>
  );
}