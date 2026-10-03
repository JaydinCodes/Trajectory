"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { PatternObservation, PatternWindow } from "@/domain/patterns/types";
import { windowLabels } from "@/domain/patterns/windows";
import styles from "./patterns.module.css";

type Response = { patterns: PatternObservation[]; availableAreas: string[]; coverage: { totalWeeks: number; evidenceWeeks: number; completedReviews: number; moodDays: number; deepWorkWeeks: number }; error?: string };
const windows: PatternWindow[] = ["4w", "8w", "12w", "year", "all"];

export default function PatternsPage() {
  const [window, setWindow] = useState<PatternWindow>("8w"); const [area, setArea] = useState(""); const [data, setData] = useState<Response>(); const [selected, setSelected] = useState<PatternObservation>(); const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { let current = true; void fetch(`/api/patterns?window=${window}${area ? `&area=${encodeURIComponent(area)}` : ""}`).then(async (response) => { const body = await response.json() as Response; if (current) setData(body); }).catch(() => current && setData({ patterns: [], availableAreas: [], coverage: { totalWeeks: 0, evidenceWeeks: 0, completedReviews: 0, moodDays: 0, deepWorkWeeks: 0 }, error: "Could not load patterns." })); return () => { current = false; }; }, [window, area]);
  useEffect(() => { if (selected) dialog.current?.showModal(); }, [selected]);
  return <main className={styles.page}>
    <Link className="back" href="/">← Today</Link>
    <header className={styles.hero}><p className="eyebrow">Patterns</p><h1>What your record is beginning to show.</h1><p>Recurring observations from the evidence you recorded. They describe association and repetition; they do not infer hidden causes.</p></header>
    <div className={styles.controls}><label>Time window<select aria-label="Time window" value={window} onChange={(event) => setWindow(event.target.value as PatternWindow)}>{windows.map((item) => <option key={item} value={item}>{windowLabels[item]}</option>)}</select></label><label>Area<select aria-label="Area" value={area} onChange={(event) => setArea(event.target.value)}><option value="">All areas</option>{data?.availableAreas.map((item) => <option key={item} value={item}>{item}</option>)}</select></label></div>
    {data && <p className={styles.coverage}>Pattern coverage: {data.coverage.evidenceWeeks} of {data.coverage.totalWeeks} selected weeks contain recorded evidence · {data.coverage.completedReviews} completed weekly reviews · mood coverage {data.coverage.moodDays ? `${data.coverage.moodDays} days` : "low"}.</p>}
    {data?.error ? <p className={styles.error}>{data.error}</p> : null}
    <section className={styles.list} aria-live="polite">{data?.patterns.map((pattern) => <article key={pattern.id} className={styles.pattern}><div><p className="eyebrow">{pattern.category.replaceAll("_", " ")}</p><h2>{pattern.title}</h2><p>{pattern.statement}</p><div className={styles.meta}><span>Based on {pattern.sampleSize} {pattern.sampleSize === 1 ? "period" : "periods"}</span><span>{pattern.timeWindow}</span></div><button className={styles.evidenceButton} onClick={() => setSelected(pattern)}>View evidence</button></div><span className={styles.confidence}>{pattern.confidence.replace("_", " ")}</span></article>)}</section>
    {data && !data.patterns.length && <p className={styles.empty}>{data.coverage.totalWeeks < 3 ? "Not enough history yet. Record a few weekly periods before Pattern Intelligence surfaces an observation." : "No conservative pattern met the evidence threshold in this window."}</p>}
    <dialog ref={dialog} className={styles.dialog} onClose={() => setSelected(undefined)}>{selected && <><header className={styles.dialogHeader}><div><p className="eyebrow">Why you’re seeing this</p><h2>{selected.title}</h2></div><button aria-label="Close evidence" onClick={() => dialog.current?.close()}>×</button></header><div className={styles.evidence}>{selected.evidence.map((group) => <article key={group.label}><h3>{group.label}</h3><dl>{group.values.map((value) => <div key={value.label}><dt>{value.label}</dt><dd>{value.value}</dd></div>)}</dl></article>)}</div></>}</dialog>
  </main>;
}
