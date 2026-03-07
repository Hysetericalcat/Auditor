"use client";

import React, { CSSProperties, useState, createContext, useContext } from "react";

// ─────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────

export type SidebarVariant  = "default" | "glass" | "solid" | "inset";
export type SidebarSize     = "sm" | "md" | "lg";
export type SidebarPosition = "left" | "right";

export interface SidebarDimensions {
  /** Width when expanded — default varies by size */
  width?: number | string;
  /** Width when collapsed (icon-only mode) — default 56px */
  collapsedWidth?: number | string;
  /** Min / max height */
  minHeight?: CSSProperties["minHeight"];
}

export interface SidebarItem {
  id:        string;
  label:     string;
  icon?:     React.ReactNode;
  badge?:    string | number;
  /** Danger / highlight */
  badgeVariant?: "default" | "danger" | "warn";
  disabled?: boolean;
  /** Makes it a section header, not clickable */
  group?:    boolean;
  /** Sub-items — rendered when parent is active */
  children?: Omit<SidebarItem, "children" | "group">[];
  onClick?:  () => void;
  href?:     string;
}

export interface SidebarProps {
  items: SidebarItem[];
  /** Bottom slot — user chip, settings, etc. */
  footer?: React.ReactNode;
  /** Top slot — brand */
  header?: React.ReactNode;
  variant?: SidebarVariant;
  size?: SidebarSize;
  position?: SidebarPosition;
  dimensions?: SidebarDimensions;
  /** Collapsible to icon-only mode */
  collapsible?: boolean;
  /** Controlled collapsed state */
  collapsed?: boolean;
  onCollapsedChange?: (v: boolean) => void;
  /** Controlled active item */
  activeItem?: string;
  onItemClick?: (item: SidebarItem) => void;
  style?: CSSProperties;
}

// ─────────────────────────────────────────────────────────────
//  CONTEXT
// ─────────────────────────────────────────────────────────────

const SidebarCtx = createContext<{ collapsed: boolean; size: SidebarSize }>({
  collapsed: false,
  size: "md",
});

// ─────────────────────────────────────────────────────────────
//  TOKENS
// ─────────────────────────────────────────────────────────────

const SIZE_MAP: Record<SidebarSize, {
  width: number; collapsedWidth: number;
  fontSize: number; groupFontSize: number;
  iconSize: number; itemHeight: number;
  itemPadding: string; groupPadding: string;
  logoSize: number;
}> = {
  sm: { width: 200, collapsedWidth: 48, fontSize: 11, groupFontSize: 9,  iconSize: 13, itemHeight: 32, itemPadding: "0 10px", groupPadding: "16px 10px 4px", logoSize: 24 },
  md: { width: 240, collapsedWidth: 56, fontSize: 12, groupFontSize: 9,  iconSize: 14, itemHeight: 38, itemPadding: "0 14px", groupPadding: "18px 14px 4px", logoSize: 30 },
  lg: { width: 280, collapsedWidth: 64, fontSize: 13, groupFontSize: 10, iconSize: 15, itemHeight: 44, itemPadding: "0 18px", groupPadding: "20px 18px 5px", logoSize: 36 },
};

const VARIANT_MAP: Record<SidebarVariant, { bg: string; border: string; backdropFilter?: string }> = {
  default: { bg: "rgba(8,14,26,0.97)",  border: "rgba(107,132,166,0.1)" },
  glass:   { bg: "rgba(8,14,26,0.7)",   border: "rgba(107,132,166,0.1)", backdropFilter: "blur(20px)" },
  solid:   { bg: "#070C17",             border: "rgba(107,132,166,0.12)" },
  inset:   { bg: "rgba(13,21,38,0.5)",  border: "rgba(107,132,166,0.08)" },
};

const BADGE_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  default: { bg: "rgba(0,196,184,0.12)",  color: "#00C4B8", border: "rgba(0,196,184,0.3)" },
  danger:  { bg: "rgba(239,68,68,0.15)",  color: "#EF4444", border: "rgba(239,68,68,0.3)" },
  warn:    { bg: "rgba(245,168,0,0.12)",  color: "#F5A800", border: "rgba(245,168,0,0.3)" },
};

// ─────────────────────────────────────────────────────────────
//  SIDEBAR ITEM ROW
// ─────────────────────────────────────────────────────────────

function SidebarRow({
  item,
  isActive,
  indent = 0,
  onClick,
}: {
  item: SidebarItem;
  isActive: boolean;
  indent?: number;
  onClick: () => void;
}) {
  const { collapsed, size } = useContext(SidebarCtx);
  const [hovered, setHovered] = useState(false);
  const sz = SIZE_MAP[size];
  const bs:any = BADGE_STYLE[item.badgeVariant ?? "default"];

  // ── Group header ──
  if (item.group) {
    if (collapsed) return null;
    return (
      <div style={{
        padding:       sz.groupPadding,
        fontFamily:    "'IBM Plex Mono', monospace",
        fontSize:      sz.groupFontSize,
        fontWeight:    600,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color:         "#2E4366",
        userSelect:    "none",
      }}>
        {item.label}
      </div>
    );
  }

  return (
    <button
      disabled={item.disabled}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:        "flex",
        alignItems:     "center",
        gap:            10,
        width:          "100%",
        height:         sz.itemHeight,
        paddingLeft:    collapsed ? 0 : `calc(${sz.itemPadding.split(" ")[1]} + ${indent * 12}px)`,
        paddingRight:   collapsed ? 0 : sz.itemPadding.split(" ")[1],
        justifyContent: collapsed ? "center" : "flex-start",
        background:
          isActive  ? "rgba(0,196,184,0.12)"
          : hovered ? "rgba(0,196,184,0.06)"
          : "transparent",
        border:    "none",
        borderLeft: !collapsed
          ? isActive  ? "2px solid #00C4B8"
          : hovered   ? "2px solid rgba(0,196,184,0.25)"
          : "2px solid transparent"
          : "none",
        borderRadius: collapsed ? 8 : "0 6px 6px 0",
        color:
          item.disabled ? "rgba(107,132,166,0.3)"
          : isActive    ? "#00C4B8"
          : hovered     ? "#C8D5E8"
          : "#8DA0BE",
        fontFamily:    "'IBM Plex Sans', sans-serif",
        fontSize:      sz.fontSize,
        fontWeight:    isActive ? 600 : 400,
        letterSpacing: "0.01em",
        cursor:        item.disabled ? "not-allowed" : "pointer",
        transition:    "all 0.12s ease",
        userSelect:    "none",
        textAlign:     "left",
        overflow:      "hidden",
        flexShrink:    0,
        position:      "relative",
      }}
    >
      {/* Active glow line */}
      {isActive && !collapsed && (
        <div style={{
          position:    "absolute",
          left:        0, top: "20%", bottom: "20%",
          width:       2, borderRadius: 9999,
          background:  "#00C4B8",
          boxShadow:   "0 0 10px rgba(0,196,184,0.7)",
        }} />
      )}

      {/* Icon */}
      {item.icon && (
        <span style={{
          display:     "flex",
          alignItems:  "center",
          justifyContent: "center",
          fontSize:    sz.iconSize,
          flexShrink:  0,
          opacity:     item.disabled ? 0.3 : 1,
          color:       isActive ? "#00C4B8" : undefined,
          filter:      isActive ? "drop-shadow(0 0 6px rgba(0,196,184,0.5))" : "none",
        }}>
          {item.icon}
        </span>
      )}

      {/* Label */}
      {!collapsed && (
        <span style={{
          flex:          1,
          overflow:      "hidden",
          textOverflow:  "ellipsis",
          whiteSpace:    "nowrap",
        }}>
          {item.label}
        </span>
      )}

      {/* Badge */}
      {!collapsed && item.badge !== undefined && (
        <span style={{
          display:        "inline-flex",
          alignItems:     "center",
          justifyContent: "center",
          minWidth:       18,
          height:         18,
          padding:        "0 5px",
          borderRadius:   9999,
          background:     bs.bg,
          border:         `1px solid ${bs.border}`,
          color:          bs.color,
          fontFamily:     "'IBM Plex Mono', monospace",
          fontSize:       9,
          fontWeight:     700,
          lineHeight:     1,
          flexShrink:     0,
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

export function Sidebar({
  items,
  header,
  footer,
  variant    = "default",
  size       = "md",
  position   = "left",
  dimensions,
  collapsible = false,
  collapsed:  collapsedProp,
  onCollapsedChange,
  activeItem: activeItemProp,
  onItemClick,
  style,
}: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [internalActive, setInternalActive]       = useState<string | null>(
    items.find(i => !i.group && i.id)?.id ?? null
  );
  const [expandedGroups, setExpandedGroups]       = useState<Set<string>>(new Set());

  const collapsed  = collapsedProp  ?? internalCollapsed;
  const activeItem = activeItemProp ?? internalActive;
  const sz         = SIZE_MAP[size];
  const vr         = VARIANT_MAP[variant];

  const toggleCollapsed = () => {
    const next = !collapsed;
    setInternalCollapsed(next);
    onCollapsedChange?.(next);
  };

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleItemClick = (item: SidebarItem) => {
    if (item.disabled || item.group) return;
    if (item.children) { toggleGroup(item.id); return; }
    setInternalActive(item.id);
    item.onClick?.();
    onItemClick?.(item);
  };

  const currentWidth = collapsed
    ? (dimensions?.collapsedWidth ?? sz.collapsedWidth)
    : (dimensions?.width ?? sz.width);

  return (
    <SidebarCtx.Provider value={{ collapsed, size }}>
      <aside
        style={{
          display:        "flex",
          flexDirection:  "column",
          width:          currentWidth,
          minHeight:      dimensions?.minHeight ?? "100vh",
          background:     vr.bg,
          backdropFilter: vr.backdropFilter,
          borderRight:    position === "left"  ? `1px solid ${vr.border}` : "none",
          borderLeft:     position === "right" ? `1px solid ${vr.border}` : "none",
          flexShrink:     0,
          overflow:       "hidden",
          transition:     "width 0.22s cubic-bezier(0.34,1.56,0.64,1)",
          position:       "relative",
          zIndex:         10,
          ...style,
        }}
      >
        {/* Header slot */}
        {header && (
          <div style={{
            padding:      collapsed ? `16px 0` : `18px 14px 14px`,
            borderBottom: `1px solid ${vr.border}`,
            flexShrink:   0,
            display:      "flex",
            justifyContent: collapsed ? "center" : "flex-start",
            transition:   "padding 0.2s ease",
          }}>
            {header}
          </div>
        )}

        {/* Nav items */}
        <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: `6px ${collapsed ? 6 : 0}px` }}>
          {items.map(item => (
            <React.Fragment key={item.id}>
              <SidebarRow
                item={item}
                isActive={item.id === activeItem}
                onClick={() => handleItemClick(item)}
              />
              {/* Sub-items */}
              {item.children && expandedGroups.has(item.id) && !collapsed && (
                <div style={{ marginBottom: 4 }}>
                  {item.children.map(child => (
                    <SidebarRow
                      key={child.id}
                      item={child}
                      isActive={child.id === activeItem}
                      indent={1}
                      onClick={() => handleItemClick(child as SidebarItem)}
                    />
                  ))}
                </div>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Collapse toggle */}
        {collapsible && (
          <button
            onClick={toggleCollapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              height:         36,
              width:          "100%",
              background:     "transparent",
              border:         "none",
              borderTop:      `1px solid ${vr.border}`,
              color:          "#2E4366",
              fontSize:       11,
              cursor:         "pointer",
              transition:     "color 0.12s ease",
              flexShrink:     0,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#8DA0BE")}
            onMouseLeave={e => (e.currentTarget.style.color = "#2E4366")}
          >
            {collapsed ? "▶" : "◀"}
          </button>
        )}

        {/* Footer slot */}
        {footer && (
          <div style={{
            padding:      collapsed ? "12px 0" : "14px",
            borderTop:    `1px solid ${vr.border}`,
            flexShrink:   0,
            display:      "flex",
            justifyContent: collapsed ? "center" : "flex-start",
            overflow:     "hidden",
          }}>
            {footer}
          </div>
        )}
      </aside>
    </SidebarCtx.Provider>
  );
}

// ─────────────────────────────────────────────────────────────
//  SIDEBAR USER CHIP
// ─────────────────────────────────────────────────────────────

export interface SidebarUserProps {
  name: string;
  role?: string;
  avatar?: React.ReactNode;
  /** 2-char initials fallback */
  initials?: string;
  size?: SidebarSize;
}

export function SidebarUser({ name, role, avatar, initials, size = "md" }: SidebarUserProps) {
  const { collapsed } = useContext(SidebarCtx);
  const sz = SIZE_MAP[size];
  const avatarSize = sz.logoSize;

  const avatarEl = avatar ?? (
    <div style={{
      width:          avatarSize,
      height:         avatarSize,
      borderRadius:   "50%",
      background:     "linear-gradient(135deg, #2E4366, #131E33)",
      border:         "1px solid rgba(107,132,166,0.25)",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      fontSize:       avatarSize * 0.35,
      fontWeight:     700,
      color:          "#8DA0BE",
      fontFamily:     "'IBM Plex Mono', monospace",
      flexShrink:     0,
    }}>
      {initials ?? name.slice(0, 2).toUpperCase()}
    </div>
  );

  if (collapsed) return <>{avatarEl}</>;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
      {avatarEl}
      <div style={{ overflow: "hidden" }}>
        <div style={{
          fontFamily:    "'IBM Plex Sans', sans-serif",
          fontSize:      sz.fontSize,
          fontWeight:    500,
          color:         "#E8EDF8",
          whiteSpace:    "nowrap",
          overflow:      "hidden",
          textOverflow:  "ellipsis",
        }}>
          {name}
        </div>
        {role && (
          <div style={{
            fontFamily:    "'IBM Plex Mono', monospace",
            fontSize:      9,
            color:         "#4A6282",
            whiteSpace:    "nowrap",
          }}>
            {role}
          </div>
        )}
      </div>
    </div>
  );
}