"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar, NavBrand } from "../../../../packages/ui/src/Navbar";
import { Button } from "../../../../packages/ui/src/Button";

// ── MOCK DATA ──────────────────────────────────────────────────

const CHECKPOINTS = [
  { id: "CP-0041", name: "Dissolution Testing", status: "pass", module: "QC Lab", updated: "2m ago" },
  { id: "CP-0039", name: "Sterility Assay", status: "fail", module: "Micro Lab", updated: "14m ago" },
  { id: "CP-0037", name: "API Potency Check", status: "warn", module: "Analytical", updated: "1h ago" },
  { id: "CP-0035", name: "Endotoxin Limit", status: "pass", module: "Micro Lab", updated: "2h ago" },
  { id: "CP-0033", name: "Particulate Matter", status: "pending", module: "QC Lab", updated: "3h ago" },
];

const RCA_ITEMS = [
  { id: "RCA-112", title: "Batch 4401 OOS — Potency", severity: "critical", owner: "S. Nair", progress: 68, days: 3 },
  { id: "RCA-109", title: "Micro Contamination Event", severity: "high", owner: "R. Mehta", progress: 41, days: 7 },
  { id: "RCA-107", title: "Equipment Calibration Drift", severity: "medium", owner: "A. Sharma", progress: 90, days: 1 },
];

const WORKFLOWS = [
  { id: "WF-088", name: "OOS Investigation Flow", runs: 14, status: "active", lastRun: "Today" },
  { id: "WF-075", name: "Deviation Escalation", runs: 6, status: "active", lastRun: "Yesterday" },
  { id: "WF-063", name: "CAPA Closure Protocol", runs: 22, status: "paused", lastRun: "3 days ago" },
];

const KPI = [
  { label: "Open Checkpoints", value: "47", delta: "+3", trend: "up", accent: "teal" },
  { label: "Active RCAs", value: "12", delta: "-2", trend: "down", accent: "green" },
  { label: "Critical Deviations", value: "3", delta: "+1", trend: "up", accent: "red" },
  { label: "Workflows Running", value: "9", delta: "0", trend: "flat", accent: "amber" },
];

const NAV = [
  { icon: "⬡", label: "Dashboard", active: true },
  { icon: "◈", label: "Checkpoints", active: false },
  { icon: "◉", label: "RCA", active: false },
  { icon: "⬟", label: "Workflows", active: false },
  { icon: "◫", label: "Reports", active: false },
  { icon: "◳", label: "Settings", active: false },
];

// ── STATUS HELPERS ──────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  pass: "#22B567",
  fail: "#EF4444",
  warn: "#F5A800",
  pending: "#A78BFA",
  info: "#00C4B8",
};

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#EF4444",
  high: "#F5A800",
  medium: "#A78BFA",
  low: "#22B567",
};

// ── COMPONENTS ─────────────────────────────────────────────────

function StatusDot({ status }: { status: string }) {
  return (
    <span style={{
      display: "inline-block",
      width: 7, height: 7,
      borderRadius: "50%",
      background: STATUS_COLOR[status] ?? "#4A6282",
      boxShadow: `0 0 6px ${STATUS_COLOR[status] ?? "#4A6282"}80`,
      flexShrink: 0,
    }} />
  );
}

function Badge({ label, color }: { label: any; color: any }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 7px",
      borderRadius: 2,
      background: `${color}18`,
      border: `1px solid ${color}35`,
      color,
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
    }}>{label}</span>
  );
}

function ProgressBar({ value, color = "#00C4B8" }: { value: number; color?: string }) {
  return (
    <div style={{ height: 3, background: "rgba(107,132,166,0.15)", borderRadius: 9999, overflow: "hidden" }}>
      <div style={{
        height: "100%", width: `${value}%`,
        background: color,
        borderRadius: 9999,
        boxShadow: `0 0 8px ${color}60`,
        transition: "width 0.6s cubic-bezier(0.34,1.56,0.64,1)",
      }} />
    </div>
  );
}

// ── NAV CARD ────────────────────────────────────────────────────

interface NavCardProps {
  icon: string;
  label: string;
  sub: string;
  accent: string;
  badge: { text: string; color: string };
  stats: { v: string; l: string }[];
  href: string;
  onNavigate: () => void;
}

function NavCard({ icon, label, sub, accent, badge, stats, onNavigate }: NavCardProps) {
  const [hov, setHov] = useState(false);

  // derive rgba channel from hex for glow/tint
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r},${g},${b}`;
  };
  const rgb = hexToRgb(accent);

  return (
    <div
      onClick={onNavigate}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        /* ── sizing ── */
        flex: 1,
        minWidth: 0,
        /* ── flex column layout ── */
        display: "flex",
        flexDirection: "column",
        /* ── surface ── */
        background: hov ? "rgba(19,30,51,0.92)" : "rgba(13,21,38,0.72)",
        border: `1px solid ${hov ? `rgba(${rgb},0.38)` : "rgba(107,132,166,0.18)"}`,
        borderRadius: 10,
        overflow: "hidden",
        /* ── interaction ── */
        cursor: "pointer",
        transform: hov ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hov
          ? `0 10px 30px rgba(4,8,16,0.55), 0 0 0 1px rgba(${rgb},0.15)`
          : "0 4px 16px rgba(4,8,16,0.4)",
        transition: "all 0.18s ease",
        position: "relative",
      }}
    >
      {/* ── accent top bar ── */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: 2,
        background: accent,
        boxShadow: `0 2px 14px rgba(${rgb},0.45)`,
      }} />

      {/* ── body — flex column ── */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        padding: "22px 20px 0 20px",
        flex: 1,
      }}>

        {/* row 1: icon + badge */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          {/* icon box */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 38,
            height: 38,
            borderRadius: 8,
            background: `rgba(${rgb},0.1)`,
            border: `1px solid rgba(${rgb},0.22)`,
            fontSize: 18,
            flexShrink: 0,
            filter: hov ? `drop-shadow(0 0 8px rgba(${rgb},0.55))` : "none",
            transition: "filter 0.18s",
          }}>{icon}</div>

          {/* badge */}
          <div style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            padding: "3px 8px",
            background: `rgba(${rgb},0.1)`,
            border: `1px solid rgba(${rgb},0.22)`,
            borderRadius: 3,
          }}>
            <div style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: badge.color,
              boxShadow: `0 0 5px ${badge.color}`,
              flexShrink: 0,
            }} />
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 9,
              fontWeight: 600,
              color: badge.color,
              letterSpacing: "0.08em",
              whiteSpace: "nowrap",
            }}>{badge.text}</span>
          </div>
        </div>

        {/* row 2: title + sub — flex column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 15,
            color: "#E8EDF8",
            letterSpacing: "-0.01em",
            lineHeight: 1.2,
          }}>{label}</div>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            color: "#4A6282",
            lineHeight: 1.4,
          }}>{sub}</div>
        </div>

        {/* row 3: stats — flex row */}
        <div style={{ display: "flex", flexDirection: "row", gap: 18 }}>
          {stats.map(s => (
            <div key={s.l} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 22,
                fontWeight: 700,
                color: "#E8EDF8",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}>{s.v}</span>
              <span style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 9,
                color: "#4A6282",
                textTransform: "uppercase",
                letterSpacing: "0.09em",
              }}>{s.l}</span>
            </div>
          ))}
        </div>

      </div>

      {/* ── footer — flex row ── */}
      <div style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "11px 20px",
        marginTop: 18,
        borderTop: "1px solid rgba(107,132,166,0.1)",
        background: hov ? `rgba(${rgb},0.06)` : "transparent",
        transition: "background 0.18s",
      }}>
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          letterSpacing: "0.05em",
          color: hov ? accent : "#4A6282",
          transition: "color 0.18s",
        }}>Open module</span>
        <span style={{
          fontSize: 13,
          color: hov ? accent : "#2E4366",
          transition: "color 0.18s, transform 0.18s",
          transform: hov ? "translateX(4px)" : "none",
        }}>→</span>
      </div>
    </div>
  );
}

// ── MAIN PAGE ───────────────────────────────────────────────────

export default function Home() {
  const [time, setTime] = useState("");
  const router = useRouter();

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      background: "#040810",
      backgroundImage: "linear-gradient(160deg, #070C17 0%, #0A0E1A 50%, #080D18 100%)",
      fontFamily: "'IBM Plex Sans', sans-serif",
      color: "#E8EDF8",
      overflow: "hidden",
      position: "relative",
    }}>

      <Navbar
        variant="default"
        size="md"
        position="sticky"
        bordered
        dimensions={{ paddingX: 40 }}
        brand={<NavBrand name="PharmaCore" tag="QMS Platform" icon="Φ" size="md" />}
        actions={
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="ghost" size="sm" onClick={() => router.push("/login")}>Sign Out</Button>
          </div>
        }
      />

      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}>

        {/* Mesh gradient bg */}
        <div style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
          background: `
            radial-gradient(ellipse 60% 50% at 10% 20%, rgba(0,196,184,0.06) 0%, transparent 60%),
            radial-gradient(ellipse 50% 60% at 90% 80%, rgba(245,168,0,0.04) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 50% 50%, rgba(167,139,250,0.025) 0%, transparent 70%)
          `,
        }} />

        {/* Main Content Area — Centered Three Cards */}
        <div style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 1100,
          padding: "0 40px",
          display: "flex",
          flexDirection: "column",
          gap: 40,
          alignItems: "center"
        }}>

          {/* Simple Branding / Title */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: "linear-gradient(135deg, #00C4B8, #006B63)",
              boxShadow: "0 0 24px rgba(0,196,184,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 800, color: "#040810",
              fontFamily: "'Syne', sans-serif",
              margin: "0 auto 16px"
            }}>Φ</div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>
              Select Module
            </h1>
            <p style={{ fontSize: 13, color: "#4A6282", fontFamily: "'IBM Plex Mono', monospace", marginTop: 4 }}>
              Authenticated via GMP Secure Access
            </p>
          </div>

          <div style={{
            display: "flex",
            flexDirection: "row",
            gap: 20,
            width: "100%",
            justifyContent: "center"
          }}>
            <NavCard
              icon="◈"
              label="Checkpoint Analysis"
              sub="Monitor every critical control point"
              accent="#00C4B8"
              badge={{ text: "LIVE", color: "#22B567" }}
              stats={[{ v: "47", l: "Active" }, { v: "3", l: "Failing" }, { v: "5", l: "Pending" }]}
              href="/checkpoints"
              onNavigate={() => router.push("/checkpoints")}
            />

            <NavCard
              icon="◉"
              label="Root Cause Analysis"
              sub="Investigate, resolve, prevent recurrence"
              accent="#EF4444"
              badge={{ text: "1 CRITICAL", color: "#EF4444" }}
              stats={[{ v: "12", l: "Open" }, { v: "3", l: "Critical" }, { v: "68%", l: "Avg Progress" }]}
              href="/rca"
              onNavigate={() => router.push("/rca")}
            />

            <NavCard
              icon="⬟"
              label="Workflow Builder"
              sub="Automate QA processes end-to-end"
              accent="#F5A800"
              badge={{ text: "9 RUNNING", color: "#F5A800" }}
              stats={[{ v: "9", l: "Running" }, { v: "3", l: "Templates" }, { v: "42", l: "Total Runs" }]}
              href="/workflows"
              onNavigate={() => router.push("/workflows")}
            />
          </div>

          {/* Minimal Footer Info */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            opacity: 0.6
          }}>
            <Badge label="Validated Zone" color="#00C4B8" />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#4A6282" }}>
              Session Active: {time}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}