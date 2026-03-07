"use client";

import React, { forwardRef, CSSProperties, useState, useId } from "react";

// ─────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────

export type InputVariant = "default" | "filled" | "ghost";
export type InputSize    = "sm" | "md" | "lg";
export type InputStatus  = "default" | "error" | "warning" | "success";

export interface InputDimensions {
  /** Override width (e.g. "100%", "320px") */
  width?: CSSProperties["width"];
  /** Override height */
  height?: CSSProperties["height"];
  /** Override min-width */
  minWidth?: CSSProperties["minWidth"];
  /** Override max-width */
  maxWidth?: CSSProperties["maxWidth"];
}

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  variant?: InputVariant;
  size?: InputSize;
  status?: InputStatus;
  /** Field label — rendered above the input */
  label?: string;
  /** Helper / hint text below */
  hint?: string;
  /** Error message — sets status to "error" automatically */
  error?: string;
  /** Leading element inside the input (icon, text, node) */
  addonLeft?: React.ReactNode;
  /** Trailing element inside the input (icon, text, node) */
  addonRight?: React.ReactNode;
  /** Stretch to fill parent */
  fullWidth?: boolean;
  /** Dimension overrides */
  dimensions?: InputDimensions;
  /** Mono font for code / IDs / numbers */
  mono?: boolean;
  /** Wrapper class for external layout control */
  wrapperClassName?: string;
  wrapperStyle?: CSSProperties;
}

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
  variant?: InputVariant;
  size?: InputSize;
  status?: InputStatus;
  label?: string;
  hint?: string;
  error?: string;
  fullWidth?: boolean;
  dimensions?: InputDimensions & { minHeight?: CSSProperties["minHeight"] };
  mono?: boolean;
  wrapperStyle?: CSSProperties;
}

// ─────────────────────────────────────────────────────────────
//  TOKENS
// ─────────────────────────────────────────────────────────────

const SIZE_MAP: Record<InputSize, { height: number; fontSize: number; padding: number; labelSize: number; iconSize: number }> = {
  sm: { height: 32, fontSize: 11, padding: 10, labelSize: 10, iconSize: 12 },
  md: { height: 40, fontSize: 12, padding: 12, labelSize: 11, iconSize: 14 },
  lg: { height: 48, fontSize: 13, padding: 14, labelSize: 12, iconSize: 15 },
};

const STATUS_MAP: Record<InputStatus, { border: string; borderFocus: string; color: string; hintColor: string }> = {
  default: {
    border:      "rgba(107,132,166,0.22)",
    borderFocus: "#00C4B8",
    color:       "#8DA0BE",
    hintColor:   "#4A6282",
  },
  error: {
    border:      "rgba(239,68,68,0.5)",
    borderFocus: "#EF4444",
    color:       "#EF4444",
    hintColor:   "#EF4444",
  },
  warning: {
    border:      "rgba(245,168,0,0.4)",
    borderFocus: "#F5A800",
    color:       "#F5A800",
    hintColor:   "#F5A800",
  },
  success: {
    border:      "rgba(34,181,103,0.4)",
    borderFocus: "#22B567",
    color:       "#22B567",
    hintColor:   "#22B567",
  },
};

const VARIANT_BG: Record<InputVariant, { idle: string; focus: string }> = {
  default: { idle: "rgba(13,21,38,0.8)",  focus: "rgba(13,21,38,0.95)" },
  filled:  { idle: "rgba(19,30,51,0.9)",  focus: "rgba(19,30,51,1)" },
  ghost:   { idle: "transparent",          focus: "rgba(13,21,38,0.5)" },
};

// ─────────────────────────────────────────────────────────────
//  LABEL + HINT
// ─────────────────────────────────────────────────────────────

function FieldLabel({ label, htmlFor, size, required }: {
  label: string;
  htmlFor?: string;
  size: InputSize;
  required?: boolean;
}) {
  const sz = SIZE_MAP[size];
  return (
    <label
      htmlFor={htmlFor}
      style={{
        display:     "block",
        fontFamily:  "'IBM Plex Mono', monospace",
        fontSize:    sz.labelSize,
        fontWeight:  500,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color:       "#8DA0BE",
        marginBottom: 5,
        userSelect:  "none",
      }}
    >
      {label}
      {required && (
        <span style={{ color: "#EF4444", marginLeft: 3 }}>*</span>
      )}
    </label>
  );
}

function FieldHint({ text, color }: { text: string; color: string }) {
  return (
    <div style={{
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize:   10,
      color,
      marginTop:  5,
      letterSpacing: "0.02em",
    }}>
      {text}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  INPUT
// ─────────────────────────────────────────────────────────────

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = "default",
      size = "md",
      status: statusProp = "default",
      label,
      hint,
      error,
      addonLeft,
      addonRight,
      fullWidth = false,
      dimensions,
      mono = false,
      wrapperStyle,
      disabled,
      onFocus,
      onBlur,
      style,
      ...rest
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false);
    const id = useId();

    const status  = error ? "error" : statusProp;
    const sz      = SIZE_MAP[size];
    const st      = STATUS_MAP[status];
    const bg      = VARIANT_BG[variant];
    const isGhost = variant === "ghost";

    const wrapperWidth = dimensions?.width ?? (fullWidth ? "100%" : "auto");

    const inputStyle: CSSProperties = {
      flex:        1,
      height:      "100%",
      background:  "transparent",
      border:      "none",
      outline:     "none",
      padding:     0,
      fontFamily:  mono ? "'IBM Plex Mono', monospace" : "'IBM Plex Sans', sans-serif",
      fontSize:    sz.fontSize,
      fontWeight:  400,
      color:       disabled ? "rgba(107,132,166,0.4)" : "#E8EDF8",
      caretColor:  st.borderFocus,
      minWidth:    0,
      ...style,
    };

    const containerStyle: CSSProperties = {
      display:      "flex",
      alignItems:   "center",
      gap:          8,
      width:        "100%",
      height:       dimensions?.height ?? sz.height,
      paddingLeft:  addonLeft  ? 8 : sz.padding,
      paddingRight: addonRight ? 8 : sz.padding,
      background:   disabled ? "rgba(8,14,26,0.5)" : (focused ? bg.focus : bg.idle),
      border:       isGhost
        ? focused ? `1px solid ${st.borderFocus}` : "none"
        : `1px solid ${focused ? st.borderFocus : st.border}`,
      borderBottom: isGhost
        ? `1px solid ${focused ? st.borderFocus : st.border}`
        : undefined,
      borderRadius: isGhost ? 0 : 4,
      boxShadow:    focused && !disabled
        ? `0 0 0 3px ${st.borderFocus}18, inset 0 1px 2px rgba(4,8,16,0.3)`
        : "inset 0 1px 2px rgba(4,8,16,0.2)",
      cursor:       disabled ? "not-allowed" : "text",
      transition:   "border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease",
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", width: wrapperWidth, minWidth: dimensions?.minWidth, maxWidth: dimensions?.maxWidth, ...wrapperStyle }}>
        {label && <FieldLabel label={label} htmlFor={id} size={size} required={rest.required} />}

        <div style={containerStyle}>
          {addonLeft && (
            <span style={{ display: "flex", alignItems: "center", fontSize: sz.iconSize, color: focused ? st.borderFocus : "#4A6282", flexShrink: 0, transition: "color 0.15s" }}>
              {addonLeft}
            </span>
          )}

          <input
            ref={ref}
            id={id}
            disabled={disabled}
            style={inputStyle}
            onFocus={e => { setFocused(true);  onFocus?.(e); }}
            onBlur={e =>  { setFocused(false); onBlur?.(e); }}
            {...rest}
          />

          {addonRight && (
            <span style={{ display: "flex", alignItems: "center", fontSize: sz.iconSize, color: "#4A6282", flexShrink: 0 }}>
              {addonRight}
            </span>
          )}
        </div>

        {(error || hint) && (
          <FieldHint
            text={error ?? hint ?? ""}
            color={st.hintColor}
          />
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

// ─────────────────────────────────────────────────────────────
//  TEXTAREA
// ─────────────────────────────────────────────────────────────

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      variant = "default",
      size = "md",
      status: statusProp = "default",
      label,
      hint,
      error,
      fullWidth = false,
      dimensions,
      mono = false,
      wrapperStyle,
      disabled,
      onFocus,
      onBlur,
      style,
      ...rest
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false);
    const id = useId();

    const status  = error ? "error" : statusProp;
    const sz      = SIZE_MAP[size];
    const st      = STATUS_MAP[status];
    const bg      = VARIANT_BG[variant];

    return (
      <div style={{ display: "flex", flexDirection: "column", width: dimensions?.width ?? (fullWidth ? "100%" : "auto"), ...wrapperStyle }}>
        {label && <FieldLabel label={label} htmlFor={id} size={size} required={rest.required} />}

        <textarea
          ref={ref}
          id={id}
          disabled={disabled}
          style={{
            width:       "100%",
            minHeight:   dimensions?.minHeight ?? 96,
            maxWidth:    dimensions?.maxWidth,
            padding:     sz.padding,
            resize:      "vertical",
            background:  disabled ? "rgba(8,14,26,0.5)" : (focused ? bg.focus : bg.idle),
            border:      `1px solid ${focused ? st.borderFocus : st.border}`,
            borderRadius: 4,
            outline:     "none",
            fontFamily:  mono ? "'IBM Plex Mono', monospace" : "'IBM Plex Sans', sans-serif",
            fontSize:    sz.fontSize,
            fontWeight:  400,
            color:       disabled ? "rgba(107,132,166,0.4)" : "#E8EDF8",
            caretColor:  st.borderFocus,
            lineHeight:  1.6,
            boxShadow:   focused && !disabled
              ? `0 0 0 3px ${st.borderFocus}18`
              : "none",
            cursor:      disabled ? "not-allowed" : "text",
            transition:  "border-color 0.15s ease, box-shadow 0.15s ease",
            ...style,
          }}
          onFocus={e => { setFocused(true);  onFocus?.(e as any); }}
          onBlur={e =>  { setFocused(false); onBlur?.(e as any); }}
          {...rest}
        />

        {(error || hint) && (
          <FieldHint text={error ?? hint ?? ""} color={st.hintColor} />
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

// ─────────────────────────────────────────────────────────────
//  SELECT WRAPPER
// ─────────────────────────────────────────────────────────────

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  size?: InputSize;
  status?: InputStatus;
  label?: string;
  hint?: string;
  error?: string;
  fullWidth?: boolean;
  dimensions?: InputDimensions;
  wrapperStyle?: CSSProperties;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ size = "md", status: statusProp = "default", label, hint, error, fullWidth, dimensions, wrapperStyle, disabled, onFocus, onBlur, style, children, ...rest }, ref) => {
    const [focused, setFocused] = useState(false);
    const id = useId();
    const status = error ? "error" : statusProp;
    const sz = SIZE_MAP[size];
    const st = STATUS_MAP[status];

    return (
      <div style={{ display: "flex", flexDirection: "column", width: dimensions?.width ?? (fullWidth ? "100%" : "auto"), ...wrapperStyle }}>
        {label && <FieldLabel label={label} htmlFor={id} size={size} required={rest.required} />}
        <div style={{ position: "relative" }}>
          <select
            ref={ref}
            id={id}
            disabled={disabled}
            style={{
              width:          "100%",
              height:         dimensions?.height ?? sz.height,
              paddingLeft:    sz.padding,
              paddingRight:   sz.padding + 20,
              background:     disabled ? "rgba(8,14,26,0.5)" : "rgba(13,21,38,0.85)",
              border:         `1px solid ${focused ? st.borderFocus : st.border}`,
              borderRadius:   4,
              outline:        "none",
              fontFamily:     "'IBM Plex Mono', monospace",
              fontSize:       sz.fontSize,
              color:          disabled ? "rgba(107,132,166,0.4)" : "#E8EDF8",
              cursor:         disabled ? "not-allowed" : "pointer",
              appearance:     "none",
              boxShadow:      focused ? `0 0 0 3px ${st.borderFocus}18` : "none",
              transition:     "border-color 0.15s ease, box-shadow 0.15s ease",
              ...style,
            }}
            onFocus={e => { setFocused(true);  onFocus?.(e); }}
            onBlur={e =>  { setFocused(false); onBlur?.(e); }}
            {...rest}
          >
            {children}
          </select>
          {/* Chevron */}
          <span style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            pointerEvents: "none", color: "#4A6282", fontSize: 10,
          }}>▼</span>
        </div>
        {(error || hint) && <FieldHint text={error ?? hint ?? ""} color={st.hintColor} />}
      </div>
    );
  }
);

Select.displayName = "Select";