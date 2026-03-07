"use client";

import { useState, useEffect, } from "react";
import { useRouter } from "next/navigation";

// ── UI Library imports ─────────────────────────────────────────
import { Button, ButtonGroup, ButtonVariant } from "../../../packages/ui/src/Button";
import { Card, CardHeader, CardBody, CardFooter, StatCard, CardAccent } from "../../../packages/ui/src/Card";
import { Navbar, NavBrand } from "../../../packages/ui/src/Navbar";
import { Input } from "../../../packages/ui/src/Input";
import { Sidebar, SidebarUser } from "../../../packages/ui/src/Sidebar";

interface NavItem {
  label: string;
}

interface Stat {
  label: string;
  value: string;
  delta: string;
  deltaPositive: boolean;
  accent: CardAccent;
}

interface Feature {
  icon: string;
  label: string;
  accent: "teal" | "red" | "amber";
  headline: string;
  body: string;
  points: string[];
}

interface HowStep {
  num: string;
  title: string;
  desc: string;
  color: string;
}

interface ComplianceItem {
  label: string;
  desc: string;
}

interface Plan {
  name: string;
  price: string;
  period: string;
  accent: "outlined" | "elevated";
  tag: string | null;
  features: string[];
  cta: string;
  ctaVariant: ButtonVariant;
}

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
}

/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE DATA
═══════════════════════════════════════════════════════════════ */

const NAV_ITEMS: NavItem[] = [
  { label: "Product" },
  { label: "Features" },
  { label: "Compliance" },
  { label: "Pricing" },
  { label: "Docs" },
];

const STATS: Stat[] = [
  { label: "Batch Inspections / Month", value: "12K+", delta: "+18%", deltaPositive: true, accent: "teal" },
  { label: "Avg RCA Resolution Time", value: "4.2d", delta: "-31%", deltaPositive: true, accent: "green" },
  { label: "Compliance Rate", value: "99.7%", delta: "+0.4", deltaPositive: true, accent: "purple" },
  { label: "Critical Deviations Caught", value: "3,812", delta: "YTD", deltaPositive: true, accent: "amber" },
];

const FEATURES: Feature[] = [
  {
    icon: "◈", label: "CHECKPOINT ANALYSIS", accent: "teal",
    headline: "Every critical control point. Always watched.",
    body: "Define multi-tier checkpoints across your entire batch lifecycle — raw material receipt through final release. Real-time status, auto-escalation, and full audit trails built in.",
    points: ["Hierarchical checkpoint trees", "Live status with glow indicators", "Auto-escalate on failure", "21 CFR Part 11 audit trail"],
  },
  {
    icon: "◉", label: "ROOT CAUSE ANALYSIS", accent: "red",
    headline: "Find the source, not just the symptom.",
    body: "Structured Ishikawa and 5-Why frameworks guided by AI. Assign owners, track resolution progress, link CAPAs, and close loops with evidence — all in one workspace.",
    points: ["Ishikawa & 5-Why templates", "AI-suggested causal pathways", "CAPA linkage & closure", "Severity scoring engine"],
  },
  {
    icon: "⬟", label: "WORKFLOW BUILDER", accent: "amber",
    headline: "Automate the process, not just the paperwork.",
    body: "Drag-and-drop workflow canvas for deviations, OOS investigations, change controls, and more. Conditional branching, parallel tracks, SLA timers — no code needed.",
    points: ["Visual node-based canvas", "Conditional & parallel branches", "SLA timers & auto-nudges", "Role-based task routing"],
  },
];

const HOW_STEPS: HowStep[] = [
  { num: "01", title: "Configure your checkpoints", desc: "Map your GMP checkpoints to batches, equipment, or process steps. Import from existing SOPs or build from our validated templates.", color: "#00C4B8" },
  { num: "02", title: "Capture deviations in real time", desc: "Field teams log observations on any device. AI immediately suggests RCA frameworks and auto-populates context from your batch record.", color: "#F5A800" },
  { num: "03", title: "Close the loop with confidence", desc: "Workflows route tasks to the right owners, escalate on SLA breach, and generate ICH-aligned reports ready for regulatory submission.", color: "#22B567" },
];

const COMPLIANCE_ITEMS: ComplianceItem[] = [
  { label: "21 CFR Part 11", desc: "Full electronic records & signatures compliance" },
  { label: "ICH Q10", desc: "Pharmaceutical Quality System alignment" },
  { label: "EU GMP Annex 11", desc: "Computerised systems validation support" },
  { label: "ISO 9001:2015", desc: "Quality management system framework" },
  { label: "EMA Guidelines", desc: "European Medicines Agency data integrity" },
  { label: "GAMP 5", desc: "Risk-based approach to GxP systems" },
];

const PLANS: Plan[] = [
  {
    name: "Starter", price: "₹12,000", period: "/mo", accent: "outlined",
    tag: null,
    features: ["Up to 50 checkpoints", "5 concurrent RCAs", "3 workflow templates", "Email alerts", "1 site"],
    cta: "Start Free Trial", ctaVariant: "outline",
  },
  {
    name: "Professional", price: "₹38,000", period: "/mo", accent: "elevated",
    tag: "Most Popular",
    features: ["Unlimited checkpoints", "Unlimited RCAs", "Unlimited workflows", "AI root cause suggestions", "Multi-site (up to 5)", "21 CFR Part 11", "Priority support"],
    cta: "Get Started", ctaVariant: "primary",
  },
  {
    name: "Enterprise", price: "Custom", period: "", accent: "outlined",
    tag: null,
    features: ["Everything in Pro", "Unlimited sites", "Custom integrations (LIMS, ERP)", "Dedicated CSM", "On-premise option", "SLA guarantee", "Validation package"],
    cta: "Contact Sales", ctaVariant: "secondary",
  },
];

const TESTIMONIALS: Testimonial[] = [
  { quote: "PharmaCore cut our OOS investigation cycle from 12 days to under 4. The RCA module is genuinely different — it guides you rather than just giving you a form.", name: "Dr. Priya Menon", role: "VP Quality, AurobindoPharma", initials: "PM" },
  { quote: "We rolled out 200+ checkpoints across 3 sites in a week. The workflow builder is the most intuitive tool I've used in 18 years in QA.", name: "Rohan Desai", role: "Head of QMS, Sun Pharma", initials: "RD" },
  { quote: "Passed our US FDA inspection with zero data integrity observations. The audit trail and electronic signatures gave the inspector exactly what they needed.", name: "Shalini Kapoor", role: "QA Director, Cipla", initials: "SK" },
];

/* ═══════════════════════════════════════════════════════════════
   SMALL HELPERS
═══════════════════════════════════════════════════════════════ */
interface TagProps {
  children: React.ReactNode;
  color?: string;
}

const Tag = ({ children, color = "#00C4B8" }: TagProps) => (
  <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", background: `${color}14`, border: `1px solid ${color}30`, borderRadius: 2, fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color }}>{children}</span>
);

interface SectionLabelProps {
  children: React.ReactNode;
}

const SectionLabel = ({ children }: SectionLabelProps) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
    <div style={{ height: 1, width: 24, background: "rgba(0,196,184,0.5)" }} />
    <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "#00C4B8" }}>{children}</span>
  </div>
);

interface CheckProps {
  color?: string;
}

const Check = ({ color = "#00C4B8" }: CheckProps) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="6.5" stroke={color} strokeOpacity="0.3" />
    <path d="M4 7l2 2 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* Animated grid lines */
function GridLines() {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{ position: "absolute", left: `${(i + 1) * 16.66}%`, top: 0, bottom: 0, width: 1, background: "rgba(107,132,166,0.04)" }} />
      ))}
      {[...Array(8)].map((_, i) => (
        <div key={i} style={{ position: "absolute", top: `${(i + 1) * 12.5}%`, left: 0, right: 0, height: 1, background: "rgba(107,132,166,0.04)" }} />
      ))}
    </div>
  );
}

/* Glowing orb */
interface OrbProps {
  x: string | number;
  y: string | number;
  color: string;
  size?: number;
  opacity?: number;
}

function Orb({ x, y, color, size = 400, opacity = 0.12 }: OrbProps) {
  return (
    <div style={{ position: "absolute", left: x, top: y, width: size, height: size, borderRadius: "50%", background: `radial-gradient(circle, ${color} 0%, transparent 70%)`, opacity, pointerEvents: "none", transform: "translate(-50%,-50%)" }} />
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTIONS
═══════════════════════════════════════════════════════════════ */

function HeroSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <section style={{ position: "relative", minHeight: "92vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 40px", overflow: "hidden" }}>
      <GridLines />
      <Orb x="10%" y="30%" color="#00C4B8" size={600} opacity={0.08} />
      <Orb x="85%" y="60%" color="#F5A800" size={500} opacity={0.05} />
      <Orb x="50%" y="10%" color="#A78BFA" size={400} opacity={0.04} />

      <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", paddingTop: 80 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <Tag>GxP Validated</Tag>
          <Tag color="#F5A800">Now with AI RCA</Tag>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22B567", boxShadow: "0 0 8px rgba(34,181,103,0.7)" }} />
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "#4A6282" }}>3,812 batches tracked today</span>
          </div>
        </div>

      
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(38px,6vw,76px)", letterSpacing: "-0.03em", lineHeight: 1.05, color: "#E8EDF8", marginBottom: 24, maxWidth: 820 }}>
          Quality Intelligence<br />
          <span style={{ color: "#00C4B8", position: "relative" }}>
            Built for Pharma.
            <svg style={{ position: "absolute", bottom: -6, left: 0, right: 0, width: "100%", height: 6 }} viewBox="0 0 300 6" preserveAspectRatio="none">
              <path d="M0 5 Q75 1 150 3 Q225 5 300 1" stroke="#00C4B8" strokeWidth="1.5" fill="none" strokeOpacity="0.5" />
            </svg>
          </span>
        </h1>

     
        <p style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 18, color: "#8DA0BE", lineHeight: 1.7, maxWidth: 580, marginBottom: 40, fontWeight: 300 }}>
          PharmaCore unifies checkpoint analysis, root cause investigation, and workflow automation — so your QA team spends time solving problems, not chasing records.
        </p>


        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 56 }}>
          {submitted ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", background: "rgba(34,181,103,0.1)", border: "1px solid rgba(34,181,103,0.25)", borderRadius: 6 }}>
              <Check color="#22B567" />
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: "#22B567" }}>We'll be in touch shortly.</span>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", background: "rgba(13,21,38,0.9)", border: "1px solid rgba(107,132,166,0.22)", borderRadius: 6, overflow: "hidden" }}>
                <Input placeholder="you@company.com" type="email" size="md" dimensions={{ width: 260 }} value={email} onChange={e => setEmail(e.target.value)} addonLeft="✉" />
                <Button variant="primary" size="md" onClick={() => email && setSubmitted(true)} style={{ borderRadius: "0 5px 5px 0", flexShrink: 0 }}>Request Demo</Button>
              </div>
              <Button variant="ghost" size="md" iconRight="→">See Live Platform</Button>
            </>
          )}
        </div>

        {/* Trust strip */}
        <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          {["21 CFR Part 11", "ICH Q10", "GMP Annex 11", "ISO 9001"].map(b => (
            <div key={b} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Check color="#4A6282" />
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "#4A6282", letterSpacing: "0.06em" }}>{b}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Floating dashboard preview */}
      <div className="flex gap-4">
      <div style={{ position: "absolute", right: -15, top: "50%", transform: "translateY(-50%)", width: "35%", maxWidth: 560, opacity: 0.9, pointerEvents: "none" }}>
        <div style={{ background: "rgba(8,14,26,0.95)", border: "1px solid rgba(107,132,166,0.18)", borderRadius: 12, padding: "16px", boxShadow: "0 24px 80px rgba(4,8,16,0.8), 0 0 0 1px rgba(107,132,166,0.1)" }}>
          {/* Mock topbar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid rgba(107,132,166,0.1)" }}>
            <div style={{ display: "flex", gap: 5 }}>{["#EF4444", "#F5A800", "#22B567"].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c, opacity: 0.6 }} />)}</div>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "#4A6282", background: "rgba(0,196,184,0.07)", border: "1px solid rgba(0,196,184,0.15)", padding: "2px 8px", borderRadius: 3 }}>LIVE · GMP Site Mumbai</div>
            <div style={{ width: 16, height: 16, borderRadius: "50%", background: "linear-gradient(135deg,#2E4366,#131E33)", border: "1px solid rgba(107,132,166,0.2)" }} />
          </div>
          {/* Mock stat row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 12 }}>
            {[{ l: "Active CPs", v: "47", c: "#00C4B8" }, { l: "Open RCAs", v: "12", c: "#EF4444" }, { l: "Running WFs", v: "9", c: "#F5A800" }].map(s => (
              <div key={s.l} style={{ background: "rgba(13,21,38,0.8)", border: `1px solid rgba(107,132,166,0.12)`, borderRadius: 6, padding: "10px 12px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 10, right: 10, height: 1.5, background: s.c, borderRadius: "0 0 2px 2px", boxShadow: `0 2px 8px ${s.c}60` }} />
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 8, color: "#4A6282", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>{s.l}</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 700, color: "#E8EDF8", letterSpacing: "-0.02em" }}>{s.v}</div>
              </div>
            ))}
          </div>
          {/* Mock table rows */}
          {[{ id: "CP-0041", name: "Dissolution Testing", status: "pass", c: "#22B567" }, { id: "CP-0039", name: "Sterility Assay", status: "fail", c: "#EF4444" }, { id: "CP-0037", name: "API Potency Check", status: "warn", c: "#F5A800" }].map((r, i) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 5, background: i === 1 ? "rgba(239,68,68,0.05)" : "transparent", marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: r.c, boxShadow: `0 0 6px ${r.c}80` }} />
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "#4A6282" }}>{r.id}</span>
                <span style={{ fontFamily: "'IBM Plex Sans',monospace", fontSize: 11, color: "#C8D5E8" }}>{r.name}</span>
              </div>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: r.c, letterSpacing: "0.08em", textTransform: "uppercase", background: `${r.c}14`, padding: "2px 7px", borderRadius: 2, border: `1px solid ${r.c}30` }}>{r.status}</span>
            </div>
          ))}
        </div>
        </div>
        <div className="w-6"></div>
        </div>
    </section>
  );
}

function StatsSection() {
  return (
    <section style={{ padding: "60px 40px", borderTop: "1px solid rgba(107,132,166,0.08)", borderBottom: "1px solid rgba(107,132,166,0.08)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          {STATS.map(s => (
            <StatCard key={s.label} label={s.label} value={s.value} delta={s.delta} deltaPositive={s.deltaPositive} accent={s.accent} size="md" />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const [active, setActive] = useState(0);
  const f = FEATURES[active] || FEATURES[0];
  if (!f) return null;
  const accentColors = { teal: "#00C4B8", red: "#EF4444", amber: "#F5A800" };
  const ac = accentColors[f.accent as keyof typeof accentColors];

  return (
    <section style={{ padding: "100px 40px", position: "relative", overflow: "hidden" }}>
      <Orb x="80%" y="50%" color={ac} size={500} opacity={0.06} />
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionLabel>Core Modules</SectionLabel>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(28px,4vw,48px)", letterSpacing: "-0.03em", color: "#E8EDF8", marginBottom: 48, maxWidth: 600, lineHeight: 1.15 }}>
          Three modules.<br />One quality system.
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 32 }}>
          {/* Tab list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {FEATURES.map((feat, i) => {
              const isA = i === active;
              const tabColor = accentColors[feat.accent];
              return (
                <button key={feat.label} onClick={() => setActive(i)}
                  style={{ display: "flex", flexDirection: "column", gap: 4, padding: "18px 20px", background: isA ? `${tabColor}0F` : "transparent", border: `1px solid ${isA ? `${tabColor}30` : "rgba(107,132,166,0.1)"}`, borderLeft: `2px solid ${isA ? tabColor : "transparent"}`, borderRadius: "0 8px 8px 0", cursor: "pointer", textAlign: "left", transition: "all 0.15s ease" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16, filter: isA ? `drop-shadow(0 0 6px ${tabColor}80)` : "none", transition: "filter 0.15s" }}>{feat.icon}</span>
                    <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: isA ? tabColor : "#4A6282" }}>{feat.label}</span>
                  </div>
                  {isA && <div style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 12, color: "#8DA0BE", lineHeight: 1.5, marginTop: 2 }}>{feat.headline}</div>}
                </button>
              );
            })}
          </div>

          {/* Detail card */}
          <Card variant="elevated" accent={f.accent} size="lg" dimensions={{ minHeight: 360 }}>
            <CardHeader
              title={<span style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>{f.headline}</span>}
              subtitle={`Module · ${f.label}`}
            />
            <CardBody>
              <p style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 14, color: "#8DA0BE", lineHeight: 1.75, marginBottom: 24 }}>{f.body}</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {f.points.map(p => (
                  <div key={p} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(13,21,38,0.5)", border: `1px solid rgba(107,132,166,0.12)`, borderRadius: 6 }}>
                    <Check color={ac} />
                    <span style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 12, color: "#C8D5E8" }}>{p}</span>
                  </div>
                ))}
              </div>
            </CardBody>
            <CardFooter>
              <Button variant="secondary" size="sm" iconRight="→">Explore {f.label.split(" ")[0]}</Button>
              <Button variant="ghost" size="sm">View Demo</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section style={{ padding: "100px 40px", background: "rgba(13,21,38,0.3)", borderTop: "1px solid rgba(107,132,166,0.08)", borderBottom: "1px solid rgba(107,132,166,0.08)", position: "relative", overflow: "hidden" }}>
      <GridLines />
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionLabel>How It Works</SectionLabel>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(28px,4vw,48px)", letterSpacing: "-0.03em", color: "#E8EDF8", marginBottom: 60, lineHeight: 1.15 }}>
          From deviation to closure<br />in three steps.
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 0, position: "relative" }}>
          {/* Connector line */}
          <div style={{ position: "absolute", top: 36, left: "16.66%", right: "16.66%", height: 1, background: `linear-gradient(90deg, #00C4B8 0%, #F5A800 50%, #22B567 100%)`, opacity: 0.3, zIndex: 0 }} />

          {HOW_STEPS.map((step, i) => (
            <div key={step.num} style={{ position: "relative", zIndex: 1, padding: "0 32px" }}>
              {/* Step number */}
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: `${step.color}14`, border: `1px solid ${step.color}40`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, boxShadow: `0 0 20px ${step.color}25` }}>
                <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, color: step.color }}>{step.num}</span>
              </div>
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700, color: "#E8EDF8", marginBottom: 12, letterSpacing: "-0.01em" }}>{step.title}</h3>
              <p style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 13, color: "#8DA0BE", lineHeight: 1.7 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComplianceSection() {
  return (
    <section style={{ padding: "100px 40px", position: "relative", overflow: "hidden" }}>
      <Orb x="50%" y="50%" color="#A78BFA" size={600} opacity={0.04} />
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          <div>
            <SectionLabel>Compliance Built-In</SectionLabel>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(28px,4vw,44px)", letterSpacing: "-0.03em", color: "#E8EDF8", marginBottom: 20, lineHeight: 1.15 }}>
              Designed for<br />regulated environments.
            </h2>
            <p style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 14, color: "#8DA0BE", lineHeight: 1.75, marginBottom: 32 }}>
              PharmaCore was architected from day one for GxP compliance — not retrofitted. Every action is timestamped, every record is immutable, and every workflow is validation-ready.
            </p>
            <ButtonGroup gap={10}>
              <Button variant="primary" size="md" glow>Download Compliance Guide</Button>
              <Button variant="ghost" size="md">View Validation Docs</Button>
            </ButtonGroup>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {COMPLIANCE_ITEMS.map(item => (
              <Card key={item.label} variant="outlined" size="sm" interactive accent="none">
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 5, background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Check color="#A78BFA" />
                  </div>
                  <div>
                    <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, fontWeight: 600, color: "#E8EDF8", marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 11, color: "#4A6282", lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const [active, setActive] = useState(0);
  const t = TESTIMONIALS[active] || TESTIMONIALS[0];
  if (!t) return null;

  return (
    <section style={{ padding: "100px 40px", background: "rgba(13,21,38,0.3)", borderTop: "1px solid rgba(107,132,166,0.08)", borderBottom: "1px solid rgba(107,132,166,0.08)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionLabel>Customer Stories</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>

          <div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 56, color: "#00C4B8", opacity: 0.3, lineHeight: 0.7, marginBottom: 16 }}>"</div>
            <blockquote style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 18, color: "#C8D5E8", lineHeight: 1.7, fontWeight: 300, marginBottom: 28 }}>
              {t.quote}
            </blockquote>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#2E4366,#131E33)", border: "1px solid rgba(107,132,166,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, fontWeight: 700, color: "#8DA0BE" }}>{t.initials}</div>
              <div>
                <div style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 13, fontWeight: 600, color: "#E8EDF8" }}>{t.name}</div>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "#4A6282" }}>{t.role}</div>
              </div>
            </div>
          </div>

          {/* Selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {TESTIMONIALS.map((item, i) => (
              <button key={i} onClick={() => setActive(i)}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", background: i === active ? "rgba(0,196,184,0.08)" : "transparent", border: `1px solid ${i === active ? "rgba(0,196,184,0.25)" : "rgba(107,132,166,0.12)"}`, borderLeft: `2px solid ${i === active ? "#00C4B8" : "transparent"}`, borderRadius: "0 8px 8px 0", cursor: "pointer", textAlign: "left", transition: "all 0.15s ease" }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: i === active ? "linear-gradient(135deg,#00C4B8,#006B63)" : "linear-gradient(135deg,#2E4366,#131E33)", border: `1px solid ${i === active ? "transparent" : "rgba(107,132,166,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, fontWeight: 700, color: i === active ? "#040810" : "#8DA0BE", flexShrink: 0, transition: "all 0.15s ease" }}>{item.initials}</div>
                <div>
                  <div style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 13, fontWeight: i === active ? 600 : 400, color: i === active ? "#E8EDF8" : "#8DA0BE" }}>{item.name}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "#4A6282", marginTop: 2 }}>{item.role}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section style={{ padding: "100px 40px", position: "relative", overflow: "hidden" }}>
      <Orb x="50%" y="60%" color="#00C4B8" size={700} opacity={0.05} />
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionLabel>Pricing</SectionLabel>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 48, flexWrap: "wrap", gap: 20 }}>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(28px,4vw,48px)", letterSpacing: "-0.03em", color: "#E8EDF8", lineHeight: 1.15, margin: 0 }}>
            Simple, transparent<br />pricing.
          </h2>
          {/* Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: annual ? "#4A6282" : "#8DA0BE" }}>Monthly</span>
            <button onClick={() => setAnnual(!annual)} style={{ width: 44, height: 24, borderRadius: 12, background: annual ? "rgba(0,196,184,0.2)" : "rgba(107,132,166,0.15)", border: `1px solid ${annual ? "rgba(0,196,184,0.4)" : "rgba(107,132,166,0.25)"}`, position: "relative", cursor: "pointer", transition: "all 0.2s ease", padding: 0 }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: annual ? "#00C4B8" : "#4A6282", position: "absolute", top: 2, left: annual ? 22 : 2, transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)" }} />
            </button>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: annual ? "#8DA0BE" : "#4A6282" }}>Annual</span>
            {annual && <Tag color="#22B567">Save 20%</Tag>}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, alignItems: "start" }}>
          {PLANS.map((plan, i) => (
            <Card key={plan.name} variant={i === 1 ? "elevated" : "outlined"} accent={i === 1 ? "teal" : "none"} size="lg"
              style={{ position: "relative", ...(i === 1 ? { transform: "scale(1.03)", zIndex: 2 } : {}) }}>
              {plan.tag && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)" }}>
                <Tag color="#00C4B8">{plan.tag}</Tag>
              </div>}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#4A6282", marginBottom: 8 }}>{plan.name}</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
                  <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 36, fontWeight: 800, color: "#E8EDF8", letterSpacing: "-0.03em", lineHeight: 1 }}>{plan.price}</span>
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "#4A6282", marginBottom: 4 }}>{plan.period}{annual && plan.price !== "Custom" ? " (annual)" : ""}</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                {plan.features.map(feat => (
                  <div key={feat} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Check color={i === 1 ? "#00C4B8" : "#4A6282"} />
                    <span style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 12, color: i === 1 ? "#C8D5E8" : "#8DA0BE" }}>{feat}</span>
                  </div>
                ))}
              </div>

              <Button variant={plan.ctaVariant} size="md" fullWidth glow={i === 1}>
                {plan.cta}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section style={{ padding: "100px 40px", position: "relative", overflow: "hidden" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Card variant="glass" size="xl" accent="teal" fullWidth style={{ textAlign: "center", position: "relative", overflow: "hidden" }}>
          <Orb x="20%" y="50%" color="#00C4B8" size={400} opacity={0.1} />
          <Orb x="80%" y="50%" color="#F5A800" size={300} opacity={0.07} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <Tag>Get Started Today</Tag>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(28px,4vw,52px)", letterSpacing: "-0.03em", color: "#E8EDF8", margin: "20px 0 16px", lineHeight: 1.1 }}>
              Ready to modernise<br />your quality system?
            </h2>
            <p style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 15, color: "#8DA0BE", lineHeight: 1.7, maxWidth: 500, margin: "0 auto 36px" }}>
              Join 200+ pharma manufacturers already using PharmaCore to accelerate quality operations and maintain continuous GMP compliance.
            </p>
            <ButtonGroup direction="row" gap={12} style={{ justifyContent: "center" }}>
              <Button variant="primary" size="lg" glow iconRight="→">Start Free 30-Day Trial</Button>
              <Button variant="outline" size="lg">Schedule a Demo</Button>
            </ButtonGroup>
            <div style={{ marginTop: 20, fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "#4A6282" }}>No credit card required · GxP validated environment · SOC 2 Type II certified</div>
          </div>
        </Card>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    { title: "Product", links: ["Checkpoints", "RCA Module", "Workflow Builder", "Reports", "API"] },
    { title: "Company", links: ["About", "Careers", "Blog", "Press", "Contact"] },
    { title: "Resources", links: ["Documentation", "Validation Pack", "Compliance Guide", "Changelog", "Status"] },
    { title: "Legal", links: ["Privacy", "Terms", "Security", "DPA", "Cookie Policy"] },
  ];

  return (
    <footer style={{ borderTop: "1px solid rgba(107,132,166,0.1)", padding: "60px 40px 32px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "240px repeat(4,1fr)", gap: 40, marginBottom: 48 }}>
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 30, height: 30, borderRadius: 6, background: "linear-gradient(135deg,#00C4B8,#006B63)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontFamily: "'Syne',sans-serif", fontWeight: 800, color: "#040810" }}>Φ</div>
              <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: "#E8EDF8" }}>PharmaCore</span>
            </div>
            <p style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 12, color: "#4A6282", lineHeight: 1.7, marginBottom: 16 }}>Quality intelligence for the modern pharmaceutical enterprise.</p>
            <div style={{ display: "flex", gap: 8 }}>
              {["LI", "TW", "GH"].map(s => (
                <div key={s} style={{ width: 28, height: 28, borderRadius: 5, background: "rgba(107,132,166,0.08)", border: "1px solid rgba(107,132,166,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "#4A6282", cursor: "pointer" }}>{s}</div>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {cols.map(col => (
            <div key={col.title}>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#2E4366", marginBottom: 14 }}>{col.title}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {col.links.map(link => (
                  <a key={link} href="#" style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 12, color: "#4A6282", textDecoration: "none", transition: "color 0.12s" }}
                    onMouseEnter={e => (e.target as HTMLElement).style.color = "#8DA0BE"}
                    onMouseLeave={e => (e.target as HTMLElement).style.color = "#4A6282"}>{link}</a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ height: 1, background: "rgba(107,132,166,0.08)", marginBottom: 24 }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "#2E4366" }}>© 2025 PharmaCore Technologies Pvt. Ltd. · Mumbai, India</div>
          <div style={{ display: "flex", gap: 16 }}>
            {["21 CFR Part 11", "SOC 2", "ISO 27001"].map(b => (
              <div key={b} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#2E4366" }} />
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "#2E4366", letterSpacing: "0.06em" }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div >
    </footer >
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter()

  useEffect(() => {
    const el = document.querySelector(".landing-scroll");
    const onScroll = () => setScrolled((el?.scrollTop || 0) > 20);
    el?.addEventListener("scroll", onScroll);
    return () => el?.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="landing-scroll" style={{
      height: "100vh", overflowY: "auto", overflowX: "hidden",
      background: "linear-gradient(160deg,#070C17 0%,#0A0E1A 50%,#080D18 100%)",
      color: "#E8EDF8",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=IBM+Plex+Mono:ital,wght@0,300;0,400;0,500;0,600;1,300&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(107,132,166,0.3); border-radius: 9999px; }
        a { color: inherit; }
      `}</style>

      <Navbar
        variant="default"
        size="md"
        position="sticky"
        bordered
        dimensions={{ maxWidth: 1200, paddingX: 40 }}
        brand={<NavBrand name="PharmaCore" tag="QMS Platform" icon="Φ" size="md" />}
        items={NAV_ITEMS}
        actions={
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="ghost" size="sm" onClick ={()=>{router.push("/login")}}>Sign In</Button>
            <Button variant="primary" size="sm" glow>Get Demo</Button>
          </div>
        }
      />

      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ComplianceSection />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
}