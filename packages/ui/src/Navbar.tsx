"use client";

import React, { CSSProperties, useState } from "react";

// ─────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────

export type NavbarVariant = "default" | "glass" | "solid" | "transparent";
export type NavbarSize    = "sm" | "md" | "lg";
export type NavbarPosition = "static" | "sticky" | "fixed";

export interface NavbarDimensions {
  /** Override navbar height */
  height?: CSSProperties["height"];
  /** Override max-width of inner container */
  maxWidth?: CSSProperties["maxWidth"];
  /** Override horizontal padding */
  paddingX?: number | string;
}

export interface NavItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  badge?: string | number;
  badgeVariant?: "default" | "danger" | "warn";
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children?: NavItem[];     // dropdown (future)
}

export interface NavbarProps {
  /** Brand logo / name area */
  brand?: React.ReactNode;
  /** Navigation items */
  items?: NavItem[];
  /** Right-side slot: actions, user avatar, etc. */
  actions?: React.ReactNode;
  variant?: NavbarVariant;
  size?: NavbarSize;
  position?: NavbarPosition;
  dimensions?: NavbarDimensions;
  /** Draws a bottom border */
  bordered?: boolean;
  style?: CSSProperties;
  className?: string;
  /** Currently active item label (controlled) */
  activeItem?: string;
  onItemClick?: (item: NavItem) => void;
}

// ─────────────────────────────────────────────────────────────
//  TOKENS
// ─────────────────────────────────────────────────────────────

const SIZE_MAP: Record<NavbarSize, { height: number; fontSize: number; paddingX: number; logoSize: number; itemPadding: string }> = {
  sm: { height: 48, fontSize: 11, paddingX: 16, logoSize: 26, itemPadding: "0 10px" },
  md: { height: 60, fontSize: 12, paddingX: 24, logoSize: 32, itemPadding: "0 14px" },
  lg: { height: 72, fontSize: 13, paddingX: 32, logoSize: 38, itemPadding: "0 18px" },
};

const VARIANT_MAP: Record<NavbarVariant, { bg: string; border: string; backdropFilter?: string }> = {
  default:     { bg: "rgba(8,14,26,0.9)",  border: "rgba(107,132,166,0.1)", backdropFilter: "blur(12px)" },
  glass:       { bg: "rgba(13,21,38,0.6)", border: "rgba(107,132,166,0.1)", backdropFilter: "blur(20px) saturate(180%)" },
  solid:       { bg: "#080E1A",            border: "rgba(107,132,166,0.12)" },
  transparent: { bg: "transparent",        border: "transparent" },
};

const BADGE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  default: { bg: "rgba(0,196,184,0.12)",  color: "#00C4B8", border: "rgba(0,196,184,0.3)" },
  danger:  { bg: "rgba(239,68,68,0.15)",  color: "#EF4444", border: "rgba(239,68,68,0.3)" },
  warn:    { bg: "rgba(245,168,0,0.12)",  color: "#F5A800", border: "rgba(245,168,0,0.3)" },
};

// ─────────────────────────────────────────────────────────────
//  NAV ITEM
// ─────────────────────────────────────────────────────────────

function NavItemButton({
  item, sz, isActive, onClick,
}: {
  item: NavItem;
  sz: typeof SIZE_MAP[NavbarSize];
  isActive: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const bc:any = BADGE_COLORS[item.badgeVariant ?? "default"];

  return (
    <button
      disabled={item.disabled}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:        "flex",
        alignItems:     "center",
        gap:            6,
        height:         "100%",
        padding:        sz.itemPadding,
        background:     "transparent",
        border:         "none",
        borderBottom:   isActive
          ? "2px solid #00C4B8"
          : hovered ? "2px solid rgba(0,196,184,0.35)" : "2px solid transparent",
        color:  item.disabled ? "rgba(107,132,166,0.3)"
              : isActive      ? "#00C4B8"
              : hovered       ? "#C8D5E8"
              : "#8DA0BE",
        fontFamily:    "'IBM Plex Mono', monospace",
        fontSize:      sz.fontSize,
        fontWeight:    isActive ? 600 : 400,
        letterSpacing: "0.05em",
        cursor:        item.disabled ? "not-allowed" : "pointer",
        whiteSpace:    "nowrap",
        transition:    "color 0.12s ease, border-color 0.12s ease",
        userSelect:    "none",
        position:      "relative",
      }}
    >
      {item.icon && (
        <span style={{ display: "flex", alignItems: "center", fontSize: sz.fontSize + 1, opacity: item.disabled ? 0.4 : 1 }}>
          {item.icon}
        </span>
      )}
      {item.label}
      {item.badge !== undefined && (
        <span style={{
          display:       "inline-flex",
          alignItems:    "center",
          justifyContent:"center",
          minWidth:      16,
          height:        16,
          padding:       "0 4px",
          borderRadius:  9999,
          background:    bc.bg,
          border:        `1px solid ${bc.border}`,
          color:         bc.color,
          fontFamily:    "'IBM Plex Mono', monospace",
          fontSize:      9,
          fontWeight:    700,
          lineHeight:    1,
        }}>
          {item.badge}
        </span>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────────────────────

export function Navbar({
  brand,
  items = [],
  actions,
  variant  = "default",
  size     = "md",
  position = "sticky",
  dimensions,
  bordered = true,
  style,
  activeItem: activeItemProp,
  onItemClick,
}: NavbarProps) {
  const [internalActive, setInternalActive] = useState<string | null>(
    items.find(i => i.active)?.label ?? null
  );

  const sz = SIZE_MAP[size];
  const vr = VARIANT_MAP[variant];
  const activeItem = activeItemProp ?? internalActive;

  const handleItemClick = (item: NavItem) => {
    if (item.disabled) return;
    setInternalActive(item.label);
    item.onClick?.();
    onItemClick?.(item);
  };

  return (
    <nav
      style={{
        position:       position,
        top:            position !== "static" ? 0 : undefined,
        left:           0,
        right:          0,
        zIndex:         100,
        height:         dimensions?.height ?? sz.height,
        background:     vr.bg,
        backdropFilter: vr.backdropFilter,
        borderBottom:   bordered ? `1px solid ${vr.border}` : "none",
        transition:     "background 0.2s ease",
        ...style,
      }}
    >
      {/* Inner container */}
      <div style={{
        display:        "flex",
        alignItems:     "center",
        height:         "100%",
        maxWidth:       dimensions?.maxWidth ?? "none",
        margin:         "0 auto",
        paddingLeft:    dimensions?.paddingX ?? sz.paddingX,
        paddingRight:   dimensions?.paddingX ?? sz.paddingX,
        gap:            20,
      }}>

        {/* Brand */}
        {brand && (
          <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
            {brand}
          </div>
        )}

        {/* Divider */}
        {brand && items.length > 0 && (
          <div style={{ width: 1, height: 20, background: "rgba(107,132,166,0.15)", flexShrink: 0 }} />
        )}

        {/* Nav items */}
        {items.length > 0 && (
          <div style={{ display: "flex", alignItems: "stretch", height: "100%", gap: 2, flex: 1 }}>
            {items.map(item => (
              <NavItemButton
                key={item.label}
                item={item}
                sz={sz}
                isActive={item.label === activeItem}
                onClick={() => handleItemClick(item)}
              />
            ))}
          </div>
        )}

        {/* Spacer */}
        {!items.length && <div style={{ flex: 1 }} />}

        {/* Actions */}
        {actions && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {actions}
          </div>
        )}
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────
//  BRAND — default brand component
// ─────────────────────────────────────────────────────────────

export interface BrandProps {
  name: string;
  tag?: string;
  icon?: React.ReactNode;
  size?: NavbarSize;
  onClick?: () => void;
}

export function NavBrand({ name, tag, icon, size = "md", onClick }: BrandProps) {
  const sz = SIZE_MAP[size];

  return (
    <button
      onClick={onClick}
      style={{
        display:    "flex",
        alignItems: "center",
        gap:        10,
        background: "none",
        border:     "none",
        cursor:     onClick ? "pointer" : "default",
        padding:    0,
      }}
    >
      {icon && (
        <div style={{
          width:        sz.logoSize,
          height:       sz.logoSize,
          borderRadius: 6,
          background:   "linear-gradient(135deg, #00C4B8, #006B63)",
          boxShadow:    "0 0 14px rgba(0,196,184,0.3)",
          display:      "flex",
          alignItems:   "center",
          justifyContent: "center",
          fontSize:     sz.logoSize * 0.45,
          color:        "#040810",
          fontWeight:   700,
          flexShrink:   0,
        }}>
          {icon}
        </div>
      )}
      <div>
        <div style={{
          fontFamily:    "'Syne', sans-serif",
          fontSize:      sz.fontSize + 2,
          fontWeight:    700,
          color:         "#E8EDF8",
          letterSpacing: "-0.015em",
          lineHeight:    1,
        }}>
          {name}
        </div>
        {tag && (
          <div style={{
            fontFamily:    "'IBM Plex Mono', monospace",
            fontSize:      9,
            color:         "#4A6282",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginTop:     2,
          }}>
            {tag}
          </div>
        )}
      </div>
    </button>
  );
}