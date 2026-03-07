"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar, NavBrand } from "../../../../../packages/ui/src/Navbar";
import { Button } from "../../../../../packages/ui/src/Button";

// ── STATUS HELPERS ──────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
    active: "#22B567",
    running: "#00C4B8",
    alert: "#EF4444",
    pending: "#A78BFA",
};

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

// ── NAV CARD ────────────────────────────────────────────────────

interface NavCardProps {
    icon: string;
    label: string;
    sub: string;
    accent: string;
    badge: { text: string; color: string };
    onNavigate: () => void;
}

function NavCard({ icon, label, sub, accent, badge, onNavigate }: NavCardProps) {
    const [hov, setHov] = useState(false);

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
                flex: 1,
                minWidth: 280,
                display: "flex",
                flexDirection: "column",
                background: hov ? "rgba(19,30,51,0.92)" : "rgba(13,21,38,0.72)",
                border: `1px solid ${hov ? `rgba(${rgb},0.38)` : "rgba(107,132,166,0.18)"}`,
                borderRadius: 10,
                overflow: "hidden",
                cursor: "pointer",
                transform: hov ? "translateY(-2px)" : "translateY(0)",
                boxShadow: hov
                    ? `0 10px 30px rgba(4,8,16,0.55), 0 0 0 1px rgba(${rgb},0.15)`
                    : "0 4px 16px rgba(4,8,16,0.4)",
                transition: "all 0.18s ease",
                position: "relative",
            }}
        >
            <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 2,
                background: accent,
                boxShadow: `0 2px 14px rgba(${rgb},0.45)`,
            }} />

            <div style={{
                display: "flex", flexDirection: "column", gap: 14,
                padding: "22px 20px 20px 20px",
            }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        width: 38, height: 38, borderRadius: 8,
                        background: `rgba(${rgb},0.1)`,
                        border: `1px solid rgba(${rgb},0.22)`,
                        fontSize: 18,
                        filter: hov ? `drop-shadow(0 0 8px rgba(${rgb},0.55))` : "none",
                        transition: "filter 0.18s",
                    }}>{icon}</div>

                    <Badge label={badge.text} color={badge.color} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <div style={{
                        fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15,
                        color: "#E8EDF8", letterSpacing: "-0.01em", lineHeight: 1.2,
                    }}>{label}</div>
                    <div style={{
                        fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                        color: "#4A6282", lineHeight: 1.4,
                    }}>{sub}</div>
                </div>
            </div>

            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "11px 20px",
                borderTop: "1px solid rgba(107,132,166,0.1)",
                background: hov ? `rgba(${rgb},0.06)` : "transparent",
                transition: "background 0.18s",
            }}>
                <span style={{
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                    color: hov ? accent : "#4A6282", transition: "color 0.18s",
                }}>Launch Module</span>
                <span style={{
                    fontSize: 13, color: hov ? accent : "#2E4366",
                    transform: hov ? "translateX(4px)" : "none", transition: "all 0.18s",
                }}>→</span>
            </div>
        </div>
    );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 12, width: "100%", marginBottom: 12
        }}>
            <div style={{ height: 1, flex: 1, background: "linear-gradient(90deg, transparent, rgba(107,132,166,0.15))" }} />
            <span style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                color: "#4A6282", textTransform: "uppercase", letterSpacing: "0.2em",
                fontWeight: 600,
            }}>{children}</span>
            <div style={{ height: 1, flex: 1, background: "linear-gradient(90deg, rgba(107,132,166,0.15), transparent)" }} />
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
                brand={<NavBrand name="PharmaCore" tag="RCA Center" icon="Φ" size="md" />}
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
                justifyContent: "flex-start",
                padding: "60px 40px",
                position: "relative",
                zIndex: 1,
            }}>

                {/* Mesh gradient bg */}
                <div style={{
                    position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
                    background: `
            radial-gradient(ellipse 60% 50% at 10% 20%, rgba(0,196,184,0.06) 0%, transparent 60%),
            radial-gradient(ellipse 50% 60% at 90% 80%, rgba(167,139,250,0.04) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 50% 50%, rgba(245,168,0,0.025) 0%, transparent 70%)
          `,
                }} />

                <div style={{
                    width: "100%", maxWidth: 1100, display: "flex", flexDirection: "column", gap: 60, alignItems: "center"
                }}>

                    {/* Header Title */}
                    <div style={{ textAlign: "center" }}>
                        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>
                            RCA Features Selection
                        </h1>
                        <p style={{ fontSize: 13, color: "#4A6282", fontFamily: "'IBM Plex Mono', monospace", marginTop: 6 }}>
                            Select a specialized module to proceed with investigation
                        </p>
                    </div>

                    {/* OCR Section */}
                    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
                        <SectionLabel>OCR Module</SectionLabel>
                        <div style={{ display: "flex", flexDirection: "row", gap: 20, width: "100%", flexWrap: "wrap", justifyContent: "center" }}>
                            <NavCard
                                icon="◈"
                                label="Document Extraction"
                                sub="Process and digitize batch records"
                                accent="#00C4B8"
                                badge={{ text: "Ready", color: "#22B567" }}
                                onNavigate={() => router.push("/rca/selectbatch")}
                            />
                            <NavCard
                                icon="◫"
                                label="Extraction History"
                                sub="Review and export digitized data"
                                accent="#A78BFA"
                                badge={{ text: "History", color: "#A78BFA" }}
                                onNavigate={() => router.push("/rca/checktables")}
                            />
                        </div>
                    </div>

                    {/* RCA Section */}
                    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
                        <SectionLabel>RCA Module</SectionLabel>
                        <div style={{ display: "flex", flexDirection: "row", gap: 20, width: "100%", flexWrap: "wrap", justifyContent: "center" }}>
                            <NavCard
                                icon="◉"
                                label="Root Cause Analysis"
                                sub="Core investigation engine"
                                accent="#EF4444"
                                badge={{ text: "Core", color: "#EF4444" }}
                                onNavigate={() => router.push("/rca/nametables")}
                            />
                            <NavCard
                                icon="◈"
                                label="Investigation Dashboard"
                                sub="High-level RCA metrics & KPIs"
                                accent="#F5A800"
                                badge={{ text: "Metrics", color: "#F5A800" }}
                                onNavigate={() => router.push("/rca/complextable")}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, opacity: 0.6, marginTop: 20 }}>
                        <Badge label="Secure Terminal" color="#00C4B8" />
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#4A6282" }}>
                            Session Active: {time}
                        </span>
                    </div>

                </div>
            </div>
        </div>
    );
}
