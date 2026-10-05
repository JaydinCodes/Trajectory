"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Attention, areaColors, LifeOrbit, ProgressChart } from "@/components/dashboard-visuals";
import { useQuickLog } from "@/components/app-chrome";
import { formatDashboardDate } from "@/lib/date-time";
import { lifeAreas } from "@/lib/areas";

type Area = { area: string; score: number; expected: number; delta: number; momentum: "accelerating" | "steady" | "slowing" | "stalled" | "insufficient_data" };
type Goal = { id: number; area: string; title: string; target: number; current: number };
type Dashboard = { score: number; expected: number; delta: number; projected: number; season: { name: string; theme: string }; seasonProgress: { percentage: number }; deepWorkMinutes: number; areas: Area[]; goals: Goal[] };
type Entry = { id: number; type: string; detail: string; amount: number | null; entry_date: string; area: string | null; project: string | null };
type Journal = { id: number; content: string; entry_type: string; entry_date: string };
const areaOrder = lifeAreas;

export function TodayDashboard() {
  const quickLog = useQuickLog();
  const [data, setData] = useState<Dashboard>(); const [entries, setEntries] = useState<Entry[]>([]); const [journal, setJournal] = useState<Journal[]>([]); const [error, setError] = useState("");
  const reload = useCallback(async () => {
    try {
      setError("");
      const responses = await Promise.all(["/api/dashboard", "/api/entries", "/api/journal"].map((url) => fetch(url)));
      if (responses.some((response) => !response.ok)) throw new Error("We couldn't load Today.");
      const [dashboard, entryList, journalList] = await Promise.all(responses.map((response) => response.json()));
      setData(dashboard as Dashboard); setEntries(entryList as Entry[]); setJournal(journalList as Journal[]);
    } catch { setError("We couldn't load Today. Your data has not been changed."); }
  }, []);
  useEffect(() => { void reload(); }, [reload]);
  useEffect(() => { const refresh = () => void reload(); window.addEventListener("trajectory:data-changed", refresh); return () => window.removeEventListener("trajectory:data-changed", refresh); }, [reload]);
  const areas = areaOrder.map((area) => data?.areas.find((item) => item.area === area) ?? { area, score: 0, expected: 0, delta: 0, momentum: "insufficient_data" as const });
  const attentionParts = Object.entries(entries.filter((entry) => entry.area || entry.project).reduce<Record<string, number>>((total, entry) => { const key = entry.project ?? entry.area; if (key) total[key] = (total[key] ?? 0) + Number(entry.amount ?? 0); return total; }, {})).map(([name, value]) => ({ name, value }));
  const latest = journal[0];
  return <main className="app-shell"><div className="dashboard">
    <header className="topline"><div><p>{formatDashboardDate()}</p><h1>Today.</h1></div><div className="top-actions"><Link href="/search"><Search size={16} /> Search</Link><button className="primary" onClick={() => quickLog?.openQuickLog()}><Plus size={16} /> Quick log <kbd>L</kbd></button></div></header>
    {error ? <section className="dashboard-error" role="alert"><div><b>We couldn&apos;t load Today.</b><span>Your data has not been changed.</span></div><button onClick={() => void reload()}>Try again</button></section> : !data ? <DashboardSkeleton /> : <>
      <p className="month-context">{data.season.name} · {data.season.theme} · {data.seasonProgress.percentage.toFixed(0)}% of this season has elapsed</p>
      <section className="performance-hero"><div className="hero-copy"><p className="eyebrow2">Current season</p><h2>{data.season.theme || data.season.name}</h2><div className="score-row"><strong>{data.score}</strong><div><b>Trajectory</b><span>{data.delta >= 0 ? "Ahead" : "Slightly behind"} expected pace · {data.delta >= 0 ? "+" : ""}{data.delta}</span></div></div><p className="delta">Actual {data.score}% · Expected {data.expected}% · Projected finish {data.projected}%</p><q>Your trajectory reflects the goals and evidence you have recorded.</q></div><div className="orbit-panel"><LifeOrbit areas={areas} /></div></section>
      <section className="today-grid"><div className="today-timeline"><p className="eyebrow2">What moved today</p><h2 className="section-title">The evidence so far.</h2>{entries.slice(0, 3).map((entry, index) => <Event key={`${entry.type}-${entry.id}`} time={index === 0 ? "Latest" : entry.entry_date.slice(5)} title={entry.type} detail={entry.detail} color={areaColors[entry.area ?? "Career"] ?? "#777"} />)}{!entries.length && <p className="empty-state">Nothing recorded today yet. Log one piece of evidence when something meaningful happens.</p>}<button className="event-add" onClick={() => quickLog?.openQuickLog()}><Plus size={16} /> Log evidence</button></div><div className="attention-section"><p className="eyebrow2">Momentum</p><h2 className="section-title">Where your attention went.</h2><Attention minutes={data.deepWorkMinutes} parts={attentionParts} /></div></section>
      <section className="goal-focus"><div><p className="eyebrow2">Current goals</p><h2 className="section-title">What needs your attention.</h2></div><div className="goal-focus-list">{data.goals.length ? data.goals.slice(0, 4).map((goal) => <Link href={`/areas/${goal.area.toLowerCase()}`} key={goal.id}><span>{goal.area}</span><b>{goal.title}</b><small>{Math.round(goal.current)} / {Math.round(goal.target)} · {Math.max(0, Math.round(goal.target - goal.current))} remaining</small></Link>) : <p className="empty-state">Create a goal to see the pace you are building toward.</p>}</div></section>
      <section className="chart-section"><div className="chart-heading"><div><p className="eyebrow2">Trajectory</p><h2 className="section-title">Actual progress, with context.</h2></div><p>Actual progress is compared with expected season pace.</p></div><ProgressChart score={data.score} expected={data.expected} /></section>
      <section className="next-step"><div><p className="eyebrow2">Continue the record</p><h2 className="section-title">Make sense of the week when you&apos;re ready.</h2></div><Link href="/review">Open weekly review →</Link></section>
      {latest ? <section className="journal-quote">“{latest.content}”<footer>{latest.entry_date} · {latest.entry_type} · <Link href="/journal">Read reflection →</Link></footer></section> : <section className="journal-quote"><p>No reflection recorded yet.</p><footer>Write when something feels worth remembering. · <Link href="/journal">Write reflection →</Link></footer></section>}
    </>}
  </div></main>;
}

function DashboardSkeleton() { return <><div className="dashboard-skeleton hero-skeleton" /><div className="dashboard-skeleton grid-skeleton" /><div className="dashboard-skeleton chart-skeleton" /></>; }
function Event({ time, title, detail, color }: { time: string; title: string; detail: string; color: string }) { return <div className="event"><time>{time}</time><div style={{ borderLeft: `3px solid ${color}`, paddingLeft: 12 }}><b>{title}</b><small>{detail}</small></div></div>; }
