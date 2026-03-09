"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Navbar, NavBrand } from "../../../../../packages/ui/src/Navbar";
import { Button } from "../../../../../packages/ui/src/Button";



interface OCRResult {
    page: string | number;
    names: { extracted_value: string; content: string }[];
    specifications: { extracted_value: string; content: string }[];
    other: { extracted_value: string; content: string }[];
    tables: any[];
    html: string;
    reportPath: string;
}

type JobStatus = "pending" | "running" | "done" | "error";

interface PageJob {
    page: number;
    status: JobStatus;
    result?: OCRResult;
    error?: string;
}



function parsePageInput(input: string): number[] {
    const pages: Set<number> = new Set();
    const parts = input.split(",").map(p => p.trim()).filter(Boolean);

    for (const part of parts) {
        if (part.includes("-")) {
            const [startStr, endStr] = part.split("-").map(s => s.trim());
            if (startStr == undefined) {
                throw new Error("End String undefined")
            }
            const start = parseInt(startStr, 10);
            if (endStr == undefined) {
                throw new Error("End String undefined")
            }
            const end = parseInt(endStr, 10);
            if (!isNaN(start) && !isNaN(end) && start <= end) {
                for (let i = start; i <= end; i++) pages.add(i);
            }
        } else {
            const num = parseInt(part, 10);
            if (!isNaN(num)) pages.add(num);
        }
    }

    return Array.from(pages).sort((a, b) => a - b);
}



type ReportView = "ocr" | "logprobs";

interface LogprobEntry {
    value: string;
    tokens: { token: string; logprob: number }[];
    avgLogprob: number;
}

function getConfidenceColor(logprob: number): string {
    const clamped = Math.max(-5, Math.min(0, logprob));
    const t = (clamped + 5) / 5;
    if (t > 0.8) return "#22B567";
    if (t > 0.5) return "#8BC34A";
    if (t > 0.3) return "#F5A800";
    if (t > 0.1) return "#EF8C00";
    return "#EF4444";
}

function getConfidenceLabel(logprob: number): string {
    if (logprob > -0.05) return "Very High";
    if (logprob > -0.3) return "High";
    if (logprob > -1.0) return "Medium";
    if (logprob > -2.5) return "Low";
    return "Very Low";
}

export default function OCRPage() {
    const router = useRouter();
    const [pageInput, setPageInput] = useState("");
    const [jobs, setJobs] = useState<PageJob[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState<number | null>(null);
    const [reportView, setReportView] = useState<ReportView>("ocr");
    const [logprobsData, setLogprobsData] = useState<Record<string, LogprobEntry> | null>(null);
    const [logprobsLoading, setLogprobsLoading] = useState(false);
    const [logprobsError, setLogprobsError] = useState<string | null>(null);
    const resultsRef = useRef<HTMLDivElement>(null);


    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const pages = parsePageInput(pageInput);
        if (pages.length === 0) return;

        const newJobs: PageJob[] = pages.map(p => ({ page: p, status: "pending" as JobStatus }));
        setJobs(newJobs);
        setIsProcessing(true);
        setActiveTab(null);


        const promises = pages.map(async (page, idx) => {
            setJobs(prev => prev.map((j, i) => i === idx ? { ...j, status: "running" } : j));

            try {
                const res = await fetch("http://localhost:3001/ocr", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ pages_no: page }),
                });

                if (!res.ok) {
                    const errBody = await res.json().catch(() => ({ message: res.statusText }));
                    throw new Error(errBody.message || res.statusText);
                }

                const result: OCRResult = await res.json();
                setJobs(prev => prev.map((j, i) => i === idx ? { ...j, status: "done", result } : j));
            } catch (err: any) {
                setJobs(prev => prev.map((j, i) => i === idx ? { ...j, status: "error", error: err.message } : j));
            }
        });

        await Promise.all(promises);
        setIsProcessing(false);
        setTimeout(() => {
            setActiveTab(0);
            resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
    }

    async function fetchLogprobs() {
        setLogprobsLoading(true);
        setLogprobsError(null);
        try {
            const res = await fetch("http://localhost:3001/logprobs");
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: res.statusText }));
                throw new Error(err.error || res.statusText);
            }
            const data = await res.json();
            setLogprobsData(data);
        } catch (err: any) {
            setLogprobsError(err.message);
        } finally {
            setLogprobsLoading(false);
        }
    }

    function handleReportViewSwitch(view: ReportView) {
        setReportView(view);
        if (view === "logprobs" && !logprobsData) {
            fetchLogprobs();
        }
    }


    function handleSemanticSearch() {
        // TODO
        console.log("🔍 Name Semantic Search triggered");
    }

    const statusIcon: Record<JobStatus, string> = {
        pending: "○",
        running: "◐",
        done: "●",
        error: "✕",
    };
    const statusColor: Record<JobStatus, string> = {
        pending: "#4A6282",
        running: "#00C4B8",
        done: "#22B567",
        error: "#EF4444",
    };

    const activeResult = activeTab !== null ? jobs[activeTab]?.result : null;

    return (
        <div style={{
            display: "flex", flexDirection: "column", minHeight: "100vh",
            background: "#040810",
            backgroundImage: "linear-gradient(160deg, #070C17 0%, #0A0E1A 50%, #080D18 100%)",
            fontFamily: "'IBM Plex Sans', sans-serif", color: "#E8EDF8",
        }}>

            {/* ── NAVBAR ── */}
            <Navbar
                variant="default" size="md" position="sticky" bordered
                dimensions={{ paddingX: 40 }}
                brand={<NavBrand name="PharmaCore" tag="OCR Pipeline" icon="Φ" size="md" />}
                actions={
                    <div style={{ display: "flex", gap: 10 }}>
                        <Button variant="ghost" size="sm" onClick={() => router.push("/rca/features")}>← Back</Button>
                        <Button variant="ghost" size="sm" onClick={() => router.push("/login")}>Sign Out</Button>
                    </div>
                }
            />

            {/* ── CONTENT ── */}
            <div style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                padding: "48px 40px", position: "relative", zIndex: 1,
            }}>

                {/* Mesh gradient */}
                <div style={{
                    position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
                    background: `
            radial-gradient(ellipse 60% 50% at 10% 20%, rgba(0,196,184,0.06) 0%, transparent 60%),
            radial-gradient(ellipse 50% 60% at 90% 80%, rgba(167,139,250,0.04) 0%, transparent 60%)
          `,
                }} />

                <div style={{ width: "100%", maxWidth: 1100, display: "flex", flexDirection: "column", gap: 40, position: "relative", zIndex: 1 }}>

                    {/* ── HEADER ── */}
                    <div style={{ textAlign: "center" }}>
                        <h1 style={{
                            fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 700,
                            letterSpacing: "-0.02em", margin: 0,
                        }}>
                            OCR Extraction Pipeline
                        </h1>
                        <p style={{
                            fontSize: 13, color: "#4A6282", fontFamily: "'IBM Plex Mono', monospace", marginTop: 8,
                        }}>
                            Enter page numbers to extract text, names, specifications &amp; tables
                        </p>
                    </div>

                    {/* ── FORM CARD ── */}
                    <div style={{
                        background: "rgba(13,21,38,0.72)", border: "1px solid rgba(107,132,166,0.18)",
                        borderRadius: 12, padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20,
                    }}>
                        <div style={{
                            display: "flex", alignItems: "center", gap: 10, marginBottom: 4,
                        }}>
                            <span style={{ fontSize: 18 }}>◈</span>
                            <span style={{
                                fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: "#E8EDF8",
                            }}>Page Selection</span>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                <label style={{
                                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                                    color: "#6B84A6", textTransform: "uppercase", letterSpacing: "0.15em",
                                }}>
                                    Page Numbers (e.g. 1, 3, 5-10, 14)
                                </label>
                                <input
                                    type="text"
                                    value={pageInput}
                                    onChange={e => setPageInput(e.target.value)}
                                    placeholder="1, 3-7, 12, 24-26"
                                    disabled={isProcessing}
                                    style={{
                                        background: "rgba(4,8,16,0.6)", border: "1px solid rgba(107,132,166,0.22)",
                                        borderRadius: 8, padding: "12px 16px",
                                        fontFamily: "'IBM Plex Mono', monospace", fontSize: 14,
                                        color: "#E8EDF8", outline: "none",
                                        transition: "border-color 0.2s",
                                    }}
                                    onFocus={e => e.currentTarget.style.borderColor = "rgba(0,196,184,0.5)"}
                                    onBlur={e => e.currentTarget.style.borderColor = "rgba(107,132,166,0.22)"}
                                />
                            </div>

                            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                                <button
                                    type="submit"
                                    disabled={isProcessing || !pageInput.trim()}
                                    style={{
                                        flex: 1, minWidth: 200, padding: "12px 24px",
                                        background: isProcessing ? "rgba(0,196,184,0.15)" : "linear-gradient(135deg, #00C4B8, #009E94)",
                                        border: "1px solid rgba(0,196,184,0.3)", borderRadius: 8,
                                        color: "#fff", fontFamily: "'Syne', sans-serif", fontWeight: 700,
                                        fontSize: 13, letterSpacing: "0.05em", cursor: isProcessing ? "wait" : "pointer",
                                        transition: "all 0.2s", opacity: !pageInput.trim() ? 0.4 : 1,
                                    }}
                                >
                                    {isProcessing ? "⟳  Processing…" : "▶  Run OCR Pipeline"}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSemanticSearch}
                                    style={{
                                        flex: 1, minWidth: 200, padding: "12px 24px",
                                        background: "rgba(167,139,250,0.1)",
                                        border: "1px solid rgba(167,139,250,0.3)", borderRadius: 8,
                                        color: "#A78BFA", fontFamily: "'Syne', sans-serif", fontWeight: 700,
                                        fontSize: 13, letterSpacing: "0.05em", cursor: "pointer",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    🔍  Name Semantic Search
                                </button>
                            </div>
                        </form>

                        {/* ── Parsed preview ── */}
                        {pageInput.trim() && (
                            <div style={{
                                display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
                                padding: "10px 14px", background: "rgba(4,8,16,0.4)",
                                borderRadius: 6, border: "1px solid rgba(107,132,166,0.1)",
                            }}>
                                <span style={{
                                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                                    color: "#4A6282", textTransform: "uppercase", letterSpacing: "0.12em",
                                }}>Pages:</span>
                                {parsePageInput(pageInput).map(p => (
                                    <span key={p} style={{
                                        display: "inline-block", padding: "2px 8px",
                                        background: "rgba(0,196,184,0.1)", border: "1px solid rgba(0,196,184,0.2)",
                                        borderRadius: 4, fontFamily: "'IBM Plex Mono', monospace",
                                        fontSize: 11, color: "#00C4B8",
                                    }}>{p}</span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── JOB STATUS BAR ── */}
                    {jobs.length > 0 && (
                        <div style={{
                            display: "flex", flexWrap: "wrap", gap: 8,
                            padding: "16px 20px", background: "rgba(13,21,38,0.55)",
                            border: "1px solid rgba(107,132,166,0.12)", borderRadius: 10,
                        }}>
                            {jobs.map((job, idx) => (
                                <button
                                    key={job.page}
                                    onClick={() => job.status === "done" && setActiveTab(idx)}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 6,
                                        padding: "6px 14px",
                                        background: activeTab === idx ? "rgba(0,196,184,0.12)" : "rgba(4,8,16,0.4)",
                                        border: `1px solid ${activeTab === idx ? "rgba(0,196,184,0.35)" : "rgba(107,132,166,0.15)"}`,
                                        borderRadius: 6, cursor: job.status === "done" ? "pointer" : "default",
                                        transition: "all 0.15s",
                                    }}
                                >
                                    <span style={{
                                        fontSize: 11, color: statusColor[job.status],
                                        animation: job.status === "running" ? "pulse 1.2s infinite" : "none",
                                    }}>
                                        {statusIcon[job.status]}
                                    </span>
                                    <span style={{
                                        fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
                                        color: activeTab === idx ? "#E8EDF8" : "#6B84A6",
                                    }}>
                                        Page {job.page}
                                    </span>
                                    {job.status === "error" && (
                                        <span style={{
                                            fontSize: 9, color: "#EF4444", fontFamily: "'IBM Plex Mono', monospace",
                                            maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                        }}>
                                            {job.error}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* ── RESULTS PANEL ── */}
                    {activeResult && (
                        <div ref={resultsRef} style={{
                            display: "flex", flexDirection: "column", gap: 0,
                            background: "rgba(13,21,38,0.72)", border: "1px solid rgba(107,132,166,0.18)",
                            borderRadius: 12, overflow: "hidden",
                        }}>
                            {/* Result header */}
                            <div style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "16px 24px",
                                background: "linear-gradient(135deg, rgba(0,196,184,0.08), rgba(167,139,250,0.05))",
                                borderBottom: "1px solid rgba(107,132,166,0.12)",
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <span style={{ fontSize: 16 }}>📄</span>
                                    <span style={{
                                        fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: "#E8EDF8",
                                    }}>
                                        Page {activeResult.page} — Extraction Results
                                    </span>
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <span style={{
                                        padding: "3px 10px", borderRadius: 4,
                                        background: "rgba(0,196,184,0.1)", border: "1px solid rgba(0,196,184,0.2)",
                                        fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#00C4B8",
                                    }}>
                                        {activeResult.names.length} names
                                    </span>
                                    <span style={{
                                        padding: "3px 10px", borderRadius: 4,
                                        background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)",
                                        fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#A78BFA",
                                    }}>
                                        {activeResult.specifications.length} specs
                                    </span>
                                    <span style={{
                                        padding: "3px 10px", borderRadius: 4,
                                        background: "rgba(245,168,0,0.1)", border: "1px solid rgba(245,168,0,0.2)",
                                        fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#F5A800",
                                    }}>
                                        {activeResult.tables.length} tables
                                    </span>
                                </div>
                            </div>

                            {/* ── Report View Toggle ── */}
                            <div style={{
                                display: "flex", gap: 0,
                                borderBottom: "1px solid rgba(107,132,166,0.12)",
                                background: "rgba(4,8,16,0.3)",
                            }}>
                                <button
                                    onClick={() => handleReportViewSwitch("ocr")}
                                    style={{
                                        flex: 1, padding: "12px 20px",
                                        background: reportView === "ocr" ? "rgba(0,196,184,0.1)" : "transparent",
                                        border: "none",
                                        borderBottom: reportView === "ocr" ? "2px solid #00C4B8" : "2px solid transparent",
                                        color: reportView === "ocr" ? "#00C4B8" : "#6B84A6",
                                        fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13,
                                        letterSpacing: "0.04em", cursor: "pointer",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    📋  OCR Report
                                </button>
                                <button
                                    onClick={() => handleReportViewSwitch("logprobs")}
                                    style={{
                                        flex: 1, padding: "12px 20px",
                                        background: reportView === "logprobs" ? "rgba(167,139,250,0.1)" : "transparent",
                                        border: "none",
                                        borderBottom: reportView === "logprobs" ? "2px solid #A78BFA" : "2px solid transparent",
                                        color: reportView === "logprobs" ? "#A78BFA" : "#6B84A6",
                                        fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13,
                                        letterSpacing: "0.04em", cursor: "pointer",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    📊  Logprobs Confidence
                                </button>
                            </div>

                            {/* ── OCR Report View ── */}
                            {reportView === "ocr" && (
                                <div
                                    style={{ padding: "24px", background: "#fff", minHeight: 300 }}
                                    dangerouslySetInnerHTML={{ __html: activeResult.html }}
                                />
                            )}

                            {/* ── Logprobs View ── */}
                            {reportView === "logprobs" && (
                                <div style={{ padding: "24px", background: "rgba(4,8,16,0.5)", minHeight: 300 }}>
                                    {logprobsLoading && (
                                        <div style={{
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            padding: 40, color: "#6B84A6",
                                            fontFamily: "'IBM Plex Mono', monospace", fontSize: 13,
                                        }}>
                                            ⟳ Loading logprobs…
                                        </div>
                                    )}
                                    {logprobsError && (
                                        <div style={{
                                            padding: "16px 20px", background: "rgba(239,68,68,0.1)",
                                            border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8,
                                            color: "#EF4444", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
                                        }}>
                                            ✕ {logprobsError}
                                        </div>
                                    )}
                                    {!logprobsLoading && !logprobsError && logprobsData && (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                            {/* Summary bar */}
                                            <div style={{
                                                display: "flex", gap: 12, flexWrap: "wrap",
                                                padding: "12px 16px", background: "rgba(13,21,38,0.6)",
                                                border: "1px solid rgba(107,132,166,0.15)", borderRadius: 8,
                                            }}>
                                                <span style={{
                                                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#6B84A6",
                                                }}>
                                                    {Object.keys(logprobsData).length} cells extracted
                                                </span>
                                                <span style={{
                                                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
                                                    color: "#22B567",
                                                }}>
                                                    ● {Object.values(logprobsData).filter(e => e.avgLogprob > -0.3).length} high confidence
                                                </span>
                                                <span style={{
                                                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
                                                    color: "#F5A800",
                                                }}>
                                                    ● {Object.values(logprobsData).filter(e => e.avgLogprob <= -0.3 && e.avgLogprob > -1.0).length} medium
                                                </span>
                                                <span style={{
                                                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
                                                    color: "#EF4444",
                                                }}>
                                                    ● {Object.values(logprobsData).filter(e => e.avgLogprob <= -1.0).length} low confidence
                                                </span>
                                            </div>

                                            {/* Table */}
                                            <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid rgba(107,132,166,0.15)" }}>
                                                <table style={{
                                                    width: "100%", borderCollapse: "collapse",
                                                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
                                                }}>
                                                    <thead>
                                                        <tr style={{ background: "rgba(13,21,38,0.8)" }}>
                                                            <th style={{ padding: "10px 14px", textAlign: "left", color: "#6B84A6", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: "1px solid rgba(107,132,166,0.15)" }}>Cell</th>
                                                            <th style={{ padding: "10px 14px", textAlign: "left", color: "#6B84A6", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: "1px solid rgba(107,132,166,0.15)" }}>Value</th>
                                                            <th style={{ padding: "10px 14px", textAlign: "left", color: "#6B84A6", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: "1px solid rgba(107,132,166,0.15)" }}>Tokens</th>
                                                            <th style={{ padding: "10px 14px", textAlign: "center", color: "#6B84A6", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: "1px solid rgba(107,132,166,0.15)" }}>Avg Logprob</th>
                                                            <th style={{ padding: "10px 14px", textAlign: "center", color: "#6B84A6", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: "1px solid rgba(107,132,166,0.15)" }}>Confidence</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {Object.entries(logprobsData).map(([cellKey, entry]) => {
                                                            const color = getConfidenceColor(entry.avgLogprob);
                                                            const label = getConfidenceLabel(entry.avgLogprob);
                                                            const barWidth = Math.max(5, Math.min(100, ((entry.avgLogprob + 5) / 5) * 100));
                                                            return (
                                                                <tr key={cellKey} style={{
                                                                    borderBottom: "1px solid rgba(107,132,166,0.08)",
                                                                    background: "rgba(4,8,16,0.3)",
                                                                    transition: "background 0.15s",
                                                                }}>
                                                                    <td style={{ padding: "10px 14px", color: "#A78BFA", fontWeight: 600 }}>{cellKey}</td>
                                                                    <td style={{ padding: "10px 14px", color: "#E8EDF8", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                        {entry.value || <span style={{ color: "#4A6282", fontStyle: "italic" }}>empty</span>}
                                                                    </td>
                                                                    <td style={{ padding: "10px 14px" }}>
                                                                        <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                                                                            {entry.tokens.map((t, i) => (
                                                                                <span key={i} title={`logprob: ${t.logprob.toFixed(4)}`} style={{
                                                                                    display: "inline-block", padding: "2px 5px",
                                                                                    background: `${getConfidenceColor(t.logprob)}18`,
                                                                                    border: `1px solid ${getConfidenceColor(t.logprob)}40`,
                                                                                    borderRadius: 3, fontSize: 11,
                                                                                    color: getConfidenceColor(t.logprob),
                                                                                }}>
                                                                                    {t.token}
                                                                                </span>
                                                                            ))}
                                                                            {entry.tokens.length === 0 && <span style={{ color: "#4A6282" }}>—</span>}
                                                                        </div>
                                                                    </td>
                                                                    <td style={{ padding: "10px 14px", textAlign: "center", color, fontWeight: 600 }}>
                                                                        {entry.avgLogprob !== 0 ? entry.avgLogprob.toFixed(4) : "—"}
                                                                    </td>
                                                                    <td style={{ padding: "10px 14px" }}>
                                                                        <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                                                                            <div style={{
                                                                                width: 60, height: 6, borderRadius: 3,
                                                                                background: "rgba(107,132,166,0.12)", overflow: "hidden",
                                                                            }}>
                                                                                <div style={{
                                                                                    width: `${barWidth}%`, height: "100%",
                                                                                    borderRadius: 3, background: color,
                                                                                    transition: "width 0.3s",
                                                                                }} />
                                                                            </div>
                                                                            <span style={{ fontSize: 10, color, fontWeight: 600 }}>{label}</span>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                    {!logprobsLoading && !logprobsError && !logprobsData && (
                                        <div style={{
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            padding: 40, color: "#4A6282", fontStyle: "italic",
                                            fontFamily: "'IBM Plex Mono', monospace", fontSize: 13,
                                        }}>
                                            No logprobs data available. Run OCR on a page with tables first.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>

            {/* ── Pulse animation ── */}
            <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
        </div>
    );
}
