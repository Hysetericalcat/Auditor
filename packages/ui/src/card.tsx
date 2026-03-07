"use client";

import React, { CSSProperties } from "react";

// ─────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────

export type CardVariant = "default" | "elevated" | "outlined" | "ghost" | "glass";
export type CardSize    = "sm" | "md" | "lg" | "xl";
export type CardAccent  = "none" | "teal" | "amber" | "red" | "green" | "purple";

export interface CardDimensions {
  width?:     CSSProperties["width"];
  height?:    CSSProperties["height"];
  minWidth?:  CSSProperties["minWidth"];
  maxWidth?:  CSSProperties["maxWidth"];
  minHeight?: CSSProperties["minHeight"];
  maxHeight?: CSSProperties["maxHeight"];
}

export interface CardProps {
  children?: React.ReactNode;
  variant?: CardVariant;
  size?: CardSize;
  /** Coloured bar at the top */
  accent?: CardAccent;
  /** Make the card clickable / interactive */
  interactive?: boolean;
  /** Full-width stretch */
  fullWidth?: boolean;
  dimensions?: CardDimensions;
  className?: string;
  style?: CSSProperties;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  /** Accessible role — defaults to "region" when not interactive */
  role?: string;
  "aria-label"?: string;
}

// ─────────────────────────────────────────────────────────────
//  TOKENS
// ─────────────────────────────────────────────────────────────

const PADDING_MAP: Record<CardSize, { padding: string; gap: string }> = {
  sm: { padding: "14px 16px", gap: "10px" },
  md: { padding: "20px 24px", gap: "14px" },
  lg: { padding: "28px 32px", gap: "18px" },
  xl: { padding: "36px 40px", gap: "22px" },
};

const VARIANT_MAP: Record<CardVariant, {
  bg: string; bgHover?: string;
  border: string; borderHover?: string;
  shadow: string;
  backdropFilter?: string;
}> = {
  default: {
    bg:          "rgba(13,21,38,0.7)",
    bgHover:     "rgba(19,30,51,0.85)",
    border:      "rgba(107,132,166,0.18)",
    borderHover: "rgba(107,132,166,0.32)",
    shadow:      "0 4px 16px rgba(4,8,16,0.5), 0 1px 4px rgba(4,8,16,0.4)",
  },
  elevated: {
    bg:          "rgba(19,30,51,0.9)",
    bgHover:     "rgba(30,45,71,0.95)",
    border:      "rgba(107,132,166,0.22)",
    borderHover: "rgba(107,132,166,0.4)",
    shadow:      "0 8px 32px rgba(4,8,16,0.6), 0 2px 8px rgba(4,8,16,0.4)",
  },
  outlined: {
    bg:          "transparent",
    bgHover:     "rgba(13,21,38,0.4)",
    border:      "rgba(107,132,166,0.3)",
    borderHover: "rgba(107,132,166,0.55)",
    shadow:      "none",
  },
  ghost: {
    bg:      "transparent",
    bgHover: "rgba(107,132,166,0.05)",
    border:  "transparent",
    shadow:  "none",
  },
  glass: {
    bg:             "rgba(19,30,51,0.45)",
    bgHover:        "rgba(19,30,51,0.6)",
    border:         "rgba(107,132,166,0.15)",
    borderHover:    "rgba(107,132,166,0.3)",
    shadow:         "0 4px 24px rgba(4,8,16,0.4)",
    backdropFilter: "blur(16px) saturate(180%)",
  },
};

const ACCENT_MAP: Record<CardAccent, { color: string; glow: string } | null> = {
  none:   null,
  teal:   { color: "#00C4B8", glow: "rgba(0,196,184,0.3)" },
  amber:  { color: "#F5A800", glow: "rgba(245,168,0,0.25)" },
  red:    { color: "#EF4444", glow: "rgba(239,68,68,0.25)" },
  green:  { color: "#22B567", glow: "rgba(34,181,103,0.25)" },
  purple: { color: "#A78BFA", glow: "rgba(167,139,250,0.25)" },
};

// ─────────────────────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────────────────────

export function Card({
  children,
  variant    = "default",
  size       = "md",
  accent     = "none",
  interactive = false,
  fullWidth  = false,
  dimensions,
  style,
  onClick,
  role,
  "aria-label": ariaLabel,
  ...rest
}: CardProps) {
  const [hovered, setHovered] = React.useState(false);

  const vr  = VARIANT_MAP[variant];
  const pd  = PADDING_MAP[size];
  const acc = ACCENT_MAP[accent];

  const resolvedBg     = (interactive && hovered && vr.bgHover)     ? vr.bgHover     : vr.bg;
  const resolvedBorder = (interactive && hovered && vr.borderHover) ? vr.borderHover : vr.border;

  const cardStyle: CSSProperties = {
    position:       "relative",
    display:        "flex",
    flexDirection:  "column",
    width:          dimensions?.width  ?? (fullWidth ? "100%" : "auto"),
    height:         dimensions?.height,
    minWidth:       dimensions?.minWidth,
    maxWidth:       dimensions?.maxWidth,
    minHeight:      dimensions?.minHeight,
    maxHeight:      dimensions?.maxHeight,
    padding:        pd.padding,
    background:     resolvedBg,
    border:         `1px solid ${resolvedBorder}`,
    borderRadius:   10,
    boxShadow:      vr.shadow,
    backdropFilter: vr.backdropFilter,
    cursor:         interactive ? "pointer" : "default",
    overflow:       "hidden",
    transition:     "background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, transform 0.12s ease",
    transform:      interactive && hovered ? "translateY(-1px)" : "translateY(0)",
    userSelect:     "none",
    ...style,
  };

  return (
    <div
      style={cardStyle}
      role={role ?? (interactive ? "button" : "region")}
      aria-label={ariaLabel}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onMouseEnter={() => interactive && setHovered(true)}
      onMouseLeave={() => interactive && setHovered(false)}
      onKeyDown={e => interactive && (e.key === "Enter" || e.key === " ") && onClick?.(e as any)}
      {...rest}
    >
      {/* Accent bar */}
      {acc && (
        <div style={{
          position:  "absolute",
          top:       0, left: 0, right: 0,
          height:    2,
          background: acc.color,
          boxShadow: `0 2px 14px ${acc.glow}`,
        }} />
      )}

      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  CARD SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────

/** Card header — title row */
export function CardHeader({
  title,
  subtitle,
  actions,
  style,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div style={{
      display:        "flex",
      alignItems:     subtitle ? "flex-start" : "center",
      justifyContent: "space-between",
      gap:            12,
      marginBottom:   16,
      ...style,
    }}>
      <div>
        <div style={{
          fontFamily:    "'Syne', sans-serif",
          fontSize:      14,
          fontWeight:    600,
          color:         "#E8EDF8",
          letterSpacing: "-0.01em",
          lineHeight:    1.2,
        }}>
          {title}
        </div>
        {subtitle && (
          <div style={{
            fontFamily:    "'IBM Plex Mono', monospace",
            fontSize:      10,
            color:         "#4A6282",
            marginTop:     3,
            letterSpacing: "0.04em",
          }}>
            {subtitle}
          </div>
        )}
      </div>
      {actions && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  );
}

/** Card body — wraps primary content */
export function CardBody({ children, style }: { children: React.ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ flex: 1, ...style }}>
      {children}
    </div>
  );
}

/** Card footer — sticks to bottom */
export function CardFooter({
  children,
  divider = true,
  style,
}: {
  children: React.ReactNode;
  divider?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div style={{
      marginTop:  16,
      paddingTop: divider ? 14 : 0,
      borderTop:  divider ? "1px solid rgba(107,132,166,0.12)" : "none",
      display:    "flex",
      alignItems: "center",
      gap:        10,
      ...style,
    }}>
      {children}
    </div>
  );
}

/** Stat card — KPI display */
export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  delta?: string;
  deltaPositive?: boolean;
  trend?: React.ReactNode;
  accent?: CardAccent;
  size?: CardSize;
  dimensions?: CardDimensions;
}

export function StatCard({
  label, value, delta, deltaPositive, trend,
  accent = "teal", size = "md", dimensions,
}: StatCardProps) {
  const acc = ACCENT_MAP[accent];

  return (
    <Card variant="default" accent={accent} size={size} dimensions={dimensions} interactive>
      <div style={{
        fontFamily:    "'IBM Plex Mono', monospace",
        fontSize:      10,
        color:         "#4A6282",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        marginBottom:  10,
      }}>
        {label}
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: trend ? 12 : 0 }}>
        <div style={{
          fontFamily:    "'Syne', sans-serif",
          fontSize:      size === "sm" ? 26 : size === "lg" ? 42 : 34,
          fontWeight:    700,
          letterSpacing: "-0.03em",
          color:         "#E8EDF8",
          lineHeight:    1,
        }}>
          {value}
        </div>
        {delta && (
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize:   11,
            color:      deltaPositive ? "#22B567" : "#EF4444",
            marginBottom: 2,
          }}>
            {delta}
          </div>
        )}
      </div>

      {trend && <div style={{ marginTop: 8 }}>{trend}</div>}
    </Card>
  );
}