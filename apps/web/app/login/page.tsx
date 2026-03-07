"use client";

import { useState } from "react";
import { Card, CardHeader, CardBody, CardFooter } from "../../../../packages/ui/src/Card";
import { Navbar, NavBrand } from "../../../../packages/ui/src/Navbar";

/* ─────────────────────────────────────────────────────────────
   LOGIN PAGE  ·  uses Card + Navbar only  ·  flex layout only
───────────────────────────────────────────────────────────── */

export default function LoginPage() {
  const [tab, setTab] = useState<"login" | "sso">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!email || !password) { setError("All fields are required."); return; }
    if (!email.includes("@")) { setError("Enter a valid email address."); return; }
    setError("");
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  /* ── shared input style ── */
  const inputWrap = (field: string): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    height: 44,
    paddingLeft: 12,
    paddingRight: 12,
    background: focused === field ? "rgba(13,21,38,0.95)" : "rgba(13,21,38,0.75)",
    border: `1px solid ${error && !email && field === "email" ? "#EF4444" :
        error && !password && field === "pass" ? "#EF4444" :
          focused === field ? "#00C4B8" :
            "rgba(107,132,166,0.22)"}`,
    borderRadius: 4,
    boxShadow: focused === field ? "0 0 0 3px rgba(0,196,184,0.1)" : "none",
    transition: "all 0.15s ease",
    cursor: "text",
  });

  const inputEl: React.CSSProperties = {
    flex: 1,
    height: "100%",
    background: "transparent",
    border: "none",
    outline: "none",
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: 13,
    color: "#E8EDF8",
    caretColor: "#00C4B8",
  };

  const label: React.CSSProperties = {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 10,
    fontWeight: 500,
    letterSpacing: "0.09em",
    textTransform: "uppercase" as const,
    color: "#8DA0BE",
    marginBottom: 6,
  };

  const adornIcon: React.CSSProperties = {
    fontSize: 14,
    color: focused ? "#00C4B8" : "#4A6282",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    transition: "color 0.15s",
    userSelect: "none",
  };

  return (
    /* ── ROOT — full-height flex column ── */
    <div style={{
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      background: "linear-gradient(160deg, #070C17 0%, #0A0E1A 55%, #080D18 100%)",
      fontFamily: "'IBM Plex Sans', sans-serif",
      color: "#E8EDF8",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* ── AMBIENT ORBS ── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "15%", left: "5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,196,184,0.07) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,168,0,0.05) 0%, transparent 70%)" }} />
        {/* subtle grid */}
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{ position: "absolute", left: `${(i + 1) * 20}%`, top: 0, bottom: 0, width: 1, background: "rgba(107,132,166,0.03)" }} />
        ))}
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ position: "absolute", top: `${(i + 1) * 16.6}%`, left: 0, right: 0, height: 1, background: "rgba(107,132,166,0.03)" }} />
        ))}
      </div>

      {/* ══════════════════════════════════════════
          NAVBAR — from @/components/ui/navbar
      ══════════════════════════════════════════ */}
      <div style={{ position: "relative", zIndex: 10, flexShrink: 0 }}>
        <Navbar
          variant="default"
          size="md"
          position="static"
          bordered
          dimensions={{ paddingX: 40 }}
          brand={
            <NavBrand
              name="PharmaCore"
              tag="QMS Platform"
              icon="Φ"
              size="md"
            />
          }
          actions={
            /* ── "Back to site" link — plain flex, no Button component ── */
            <div
              onMouseEnter={e => (e.currentTarget.style.color = "#00C4B8")}
              onMouseLeave={e => (e.currentTarget.style.color = "#4A6282")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                fontFamily: "'IBM Plex Mono',monospace",
                fontSize: 11,
                color: "#4A6282",
                letterSpacing: "0.05em",
                transition: "color 0.12s"
              }}
            >
              ← Back to site
            </div>
          }
        />
      </div>

      {/* ══════════════════════════════════════════
          MAIN BODY — flex row, grows to fill
      ══════════════════════════════════════════ */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "row",
        position: "relative",
        zIndex: 1,
      }}>

        {/* ── LEFT PANEL — info / branding ── */}
        <div style={{
          flex: "0 0 42%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 56px",
          borderRight: "1px solid rgba(107,132,166,0.08)",
        }}>

          {/* headline */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
              <div style={{ height: 1, width: 20, background: "#00C4B8" }} />
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#00C4B8" }}>
                Secure Access Portal
              </span>
            </div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 40, letterSpacing: "-0.03em", color: "#E8EDF8", lineHeight: 1.1, marginBottom: 16 }}>
              Welcome back<br />
              <span style={{ color: "#00C4B8" }}>to PharmaCore.</span>
            </h1>
            <p style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 14, color: "#8DA0BE", lineHeight: 1.75, maxWidth: 360 }}>
              Your GMP checkpoint, RCA, and workflow hub — sign in to access your quality operations dashboard.
            </p>
          </div>

          {/* ── THREE INFO CARDS stacked vertically using Card ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

            {/* Card 1 */}
            <Card variant="outlined" size="sm" accent="teal" interactive
              dimensions={{ width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: "rgba(0,196,184,0.1)", border: "1px solid rgba(0,196,184,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16,
                }}>◈</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <div style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 12, fontWeight: 600, color: "#E8EDF8" }}>Checkpoint Analysis</div>
                  <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "#4A6282" }}>47 active · 3 pending review</div>
                </div>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22B567", boxShadow: "0 0 6px rgba(34,181,103,0.7)" }} />
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "#22B567" }}>LIVE</span>
                </div>
              </div>
            </Card>

            {/* Card 2 */}
            <Card variant="outlined" size="sm" accent="red" interactive
              dimensions={{ width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16,
                }}>◉</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <div style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 12, fontWeight: 600, color: "#E8EDF8" }}>RCA Investigations</div>
                  <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "#4A6282" }}>12 open · 1 critical overdue</div>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "#EF4444", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", padding: "2px 7px", borderRadius: 2, letterSpacing: "0.08em" }}>ACTION</span>
                </div>
              </div>
            </Card>

            {/* Card 3 */}
            <Card variant="outlined" size="sm" accent="amber" interactive
              dimensions={{ width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: "rgba(245,168,0,0.1)", border: "1px solid rgba(245,168,0,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16,
                }}>⬟</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <div style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 12, fontWeight: 600, color: "#E8EDF8" }}>Active Workflows</div>
                  <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "#4A6282" }}>9 running · 2 awaiting sign-off</div>
                </div>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#F5A800", boxShadow: "0 0 6px rgba(245,168,0,0.7)" }} />
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "#F5A800" }}>9 RUNNING</span>
                </div>
              </div>
            </Card>

          </div>

          {/* bottom footnote */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 32 }}>
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#22B567", boxShadow: "0 0 6px rgba(34,181,103,0.7)" }} />
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "#4A6282" }}>
              SOC 2 Type II  ·  21 CFR Part 11  ·  ISO 27001
            </span>
          </div>
        </div>

        {/* ── RIGHT PANEL — login card ── */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 40px",
        }}>

          {/* ══════════════════════════════════════════
              MAIN LOGIN CARD — from @/components/ui/card
          ══════════════════════════════════════════ */}
          <Card
            variant="elevated"
            size="lg"
            accent="teal"
            dimensions={{ width: "100%", maxWidth: 440 }}
          >
            <CardHeader
              title="Sign in to your account"
              subtitle="GMP Quality Management System"
            />

            <CardBody>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {/* ── TAB ROW — Login / SSO ── */}
                <div style={{
                  display: "flex",
                  flexDirection: "row",
                  background: "rgba(8,14,26,0.6)",
                  border: "1px solid rgba(107,132,166,0.15)",
                  borderRadius: 6,
                  padding: 3,
                  gap: 3,
                }}>
                  {(["login", "sso"] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)} style={{
                      flex: 1,
                      height: 34,
                      background: tab === t ? "rgba(0,196,184,0.12)" : "transparent",
                      border: tab === t ? "1px solid rgba(0,196,184,0.25)" : "1px solid transparent",
                      borderRadius: 4,
                      color: tab === t ? "#00C4B8" : "#4A6282",
                      fontFamily: "'IBM Plex Mono',monospace",
                      fontSize: 11,
                      fontWeight: tab === t ? 600 : 400,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}>
                      {t === "login" ? "Password" : "SSO / SAML"}
                    </button>
                  ))}
                </div>

                {tab === "login" ? (
                  <>
                    {/* ── EMAIL FIELD ── */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <div style={label}>Email address</div>
                      <div style={inputWrap("email")}
                        onClick={() => setFocused("email")}>
                        <span style={{ ...adornIcon, color: focused === "email" ? "#00C4B8" : "#4A6282" }}>✉</span>
                        <input
                          type="email"
                          placeholder="you@company.com"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          onFocus={() => setFocused("email")}
                          onBlur={() => setFocused(null)}
                          style={inputEl}
                        />
                      </div>
                    </div>

                    {/* ── PASSWORD FIELD ── */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <div style={label}>Password</div>
                        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "#00C4B8", cursor: "pointer" }}>
                          Forgot password?
                        </span>
                      </div>
                      <div style={inputWrap("pass")}
                        onClick={() => setFocused("pass")}>
                        <span style={{ ...adornIcon, color: focused === "pass" ? "#00C4B8" : "#4A6282" }}>🔒</span>
                        <input
                          type={showPass ? "text" : "password"}
                          placeholder="••••••••••"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          onFocus={() => setFocused("pass")}
                          onBlur={() => setFocused(null)}
                          style={inputEl}
                        />
                        <span
                          onClick={e => { e.stopPropagation(); setShowPass(!showPass); }}
                          style={{ ...adornIcon, cursor: "pointer", fontSize: 12 }}>
                          {showPass ? "🙈" : "👁"}
                        </span>
                      </div>
                    </div>

                    {/* ── ERROR ── */}
                    {error && (
                      <div style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                        padding: "9px 12px",
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.22)",
                        borderRadius: 4,
                      }}>
                        <span style={{ fontSize: 12, flexShrink: 0 }}>⚠</span>
                        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "#EF4444" }}>{error}</span>
                      </div>
                    )}

                    {/* ── REMEMBER ME ── */}
                    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <div style={{
                        width: 16, height: 16, borderRadius: 3, flexShrink: 0,
                        background: "rgba(0,196,184,0.1)", border: "1px solid rgba(0,196,184,0.3)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer",
                      }}>
                        <div style={{ width: 8, height: 8, borderRadius: 1, background: "#00C4B8" }} />
                      </div>
                      <span style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 12, color: "#8DA0BE" }}>
                        Keep me signed in for 30 days
                      </span>
                    </div>

                    {/* ── SUBMIT BUTTON — flex row, no Button component ── */}
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        height: 46,
                        width: "100%",
                        background: loading ? "rgba(0,196,184,0.4)" : "linear-gradient(135deg,#00C4B8,#00AFA4)",
                        border: "none",
                        borderRadius: 4,
                        color: "#040810",
                        fontFamily: "'IBM Plex Mono',monospace",
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        cursor: loading ? "not-allowed" : "pointer",
                        boxShadow: loading ? "none" : "0 0 20px rgba(0,196,184,0.25)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {loading
                        ? <><span style={{ fontSize: 14, animation: "pharma-spin 0.7s linear infinite", display: "inline-block" }}>⟳</span> Authenticating…</>
                        : <>Sign In →</>
                      }
                    </button>
                  </>
                ) : (
                  /* ── SSO TAB ── */
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <div style={label}>Organisation domain</div>
                      <div style={inputWrap("sso")} onClick={() => setFocused("sso")}>
                        <span style={{ ...adornIcon, color: focused === "sso" ? "#00C4B8" : "#4A6282" }}>🏢</span>
                        <input
                          type="text"
                          placeholder="yourcompany.com"
                          onFocus={() => setFocused("sso")}
                          onBlur={() => setFocused(null)}
                          style={inputEl}
                        />
                      </div>
                    </div>
                    <button style={{
                      display: "flex", flexDirection: "row", alignItems: "center",
                      justifyContent: "center", gap: 8, height: 46, width: "100%",
                      background: "rgba(0,196,184,0.1)", border: "1px solid rgba(0,196,184,0.3)",
                      borderRadius: 4, color: "#00C4B8",
                      fontFamily: "'IBM Plex Mono',monospace", fontSize: 12,
                      fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                      cursor: "pointer", transition: "all 0.15s ease",
                    }}>
                      Continue with SSO →
                    </button>
                    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1, height: 1, background: "rgba(107,132,166,0.12)" }} />
                      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "#2E4366" }}>SUPPORTED</span>
                      <div style={{ flex: 1, height: 1, background: "rgba(107,132,166,0.12)" }} />
                    </div>
                    {["Okta", "Azure AD", "Google Workspace", "ADFS"].map(p => (
                      <div key={p} style={{
                        display: "flex", flexDirection: "row", alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px", borderRadius: 5,
                        background: "rgba(13,21,38,0.5)", border: "1px solid rgba(107,132,166,0.1)",
                        cursor: "pointer",
                      }}>
                        <span style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 12, color: "#8DA0BE" }}>{p}</span>
                        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "#4A6282" }}>SAML 2.0 →</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardBody>

            <CardFooter divider>
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <span style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 12, color: "#4A6282" }}>
                  No account?{" "}
                  <span style={{ color: "#00C4B8", cursor: "pointer" }}>Request access</span>
                </span>
                <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22B567", boxShadow: "0 0 5px rgba(34,181,103,0.7)" }} />
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "#2E4366" }}>GMP Environment</span>
                </div>
              </div>
            </CardFooter>
          </Card>

          {/* ── BOTTOM AUDIT NOTE — flex row ── */}
          <div style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            marginTop: 24,
          }}>
            {["End-to-end encrypted", "21 CFR Part 11 compliant", "Audit logged"].map((note, i) => (
              <div key={note} style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 5 }}>
                {i > 0 && <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#2E4366" }} />}
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "#2E4366", letterSpacing: "0.06em" }}>{note}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── FOOTER BAR ── */}
      <div style={{
        position: "relative",
        zIndex: 1,
        flexShrink: 0,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 40px",
        borderTop: "1px solid rgba(107,132,166,0.08)",
      }}>
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "#2E4366" }}>
          © 2025 PharmaCore Technologies Pvt. Ltd.
        </span>
        <div style={{ display: "flex", flexDirection: "row", gap: 20 }}>
          {["Privacy Policy", "Terms of Service", "Security"].map(l => (
            <span key={l} style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "#2E4366", cursor: "pointer" }}>{l}</span>
          ))}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
        @keyframes pharma-spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #2E4366; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(107,132,166,0.2); border-radius: 9999px; }
      `}</style>
    </div>
  );
}