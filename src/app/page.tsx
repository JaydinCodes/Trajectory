"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Attention, areaColors, LifeOrbit, ProgressChart } from "@/components/dashboard-visuals";

type Area = { area: string; score: number };
type Dashboard = { score: number; bibleDays: number; gymSessions: number; codingProblems: number; deepWorkMinutes: number; areas: Area[] };
type Entry = { id: number; type: string; detail: string; amount: number | null; entry_date: string; created_at: string };
type Journal = { id: number; content: string; entry_type: string; entry_date: string };
type Goal = { id: number; area: string; title: string; target: number; current_value: number; deadline: string | null };

const areaOrder = ["Faith", "Fitness", "Odysseus", "Ledgerly", "Career", "Coding", "Finance", "Personal"];
const logKinds = ["Scripture", "Workout", "Deep Work", "DSA", "Revenue", "Finance", "Journal", "Milestone", "Mood"];

export default function Home() {
  const [data, setData] = useState<Dashboard>();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [journal, setJournal] = useState<Journal[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("Deep Work");
  const [detail, setDetail] = useState("");
  const reload = async () => {
    const [dashboard, entryList, journalList, goalList] = await Promise.all(["/api/dashboard", "/api/entries", "/api/journal", "/api/goals"].map((url) => fetch(url).then((r) => r.json())));
    setData(dashboard); setEntries(entryList); setJournal(journalList); setGoals(goalList);
  };
  useEffect(() => { void reload(); }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.key.toLowerCase() === "l" || (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey))) && !(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)) {
        event.preventDefault(); setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, []);
  async function log(event: React.FormEvent) {
    event.preventDefault(); if (!detail.trim()) return;
    await fetch("/api/entries", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: kind, detail: detail.trim(), date: new Date().toISOString().slice(0, 10) }) });
    setDetail(""); setOpen(false); void reload();
  }
  const areas = areaOrder.map((area) => data?.areas.find((item) => item.area === area) ?? { area, score: 0 });
  const latest = journal[0]; const pace = 45;
  const attentionParts = Object.entries(entries.filter((entry) => entry.type === "Deep work" || entry.type === "DSA").reduce<Record<string, number>>((total, entry) => {
    const area = entry.detail.toLowerCase().includes("ledgerly") ? "Ledgerly" : entry.detail.toLowerCase().includes("odysseus") ? "Odysseus" : entry.type === "DSA" ? "Coding" : "Career";
    total[area] = (total[area] ?? 0) + (Number(entry.amount) || (entry.type === "DSA" ? 30 : 0)); return total;
  }, {})).map(([name, value]) => ({ name, value }));
  const eventColor = (entry: Entry) => areaColors[entry.type === "Bible" || entry.type === "Scripture" ? "Faith" : entry.type === "Workout" ? "Fitness" : entry.type === "DSA" ? "Coding" : entry.detail.toLowerCase().includes("ledgerly") ? "Ledgerly" : entry.detail.toLowerCase().includes("odysseus") ? "Odysseus" : "Career"];

  return <main className="app-shell">
    <div className="dashboard">
      <header className="topline"><div><p>Wed, 14 October</p><h1>Good morning, Jaydin.</h1></div><div className="top-actions"><Link href="/search"><Search size={16} /> Search</Link><button className="primary" onClick={() => setOpen(true)}><Plus size={16} /> Quick log</button></div></header>
      <p className="month-context">October · Consistency + Execution · 45% of the month has passed</p>
      <section className="performance-hero"><div className="hero-copy"><p className="eyebrow2">October 2026</p><h2>Consistency<br />+ Execution</h2><div className="score-row"><strong>{data?.score ?? 0}</strong><div><b>Trajectory</b><span>{(data?.score ?? 0) >= pace ? `+${(data?.score ?? 0) - pace}` : (data?.score ?? 0) - pace} vs expected pace</span></div></div><p className="delta">Projected month score · {Math.min(100, (data?.score ?? 0) + 6)}</p><q>You’re building evidence. Let the lowest-momentum area set your next block.</q></div><div className="orbit-panel"><LifeOrbit areas={areas} /></div></section>
      <section className="momentum-strip">{areas.map((area) => <Link href={`/areas/${area.area.toLowerCase()}`} className="momentum" style={{ "--area": areaColors[area.area] ?? "#777" } as React.CSSProperties} key={area.area}><b>{area.area}</b><em>{area.score >= 70 ? "↑ Accelerating" : area.score >= 45 ? "→ Building" : area.score ? "↓ Needs attention" : "→ Set direction"}</em><small>{area.score ? `${area.score}% trajectory` : "No goal yet"}</small></Link>)}</section>
      <section className="today-grid"><div className="today-timeline"><p className="eyebrow2">Today</p><h2 className="section-title">What moved today?</h2>{entries.slice(0, 3).map((entry, index) => <Event key={entry.id} time={index === 0 ? "Latest" : entry.entry_date.slice(5)} title={entry.type} detail={entry.detail} color={eventColor(entry)} />)}{!entries.length && <p className="empty-state">Nothing logged yet. Start with one honest piece of evidence.</p>}<button className="event-add" onClick={() => setOpen(true)}><Plus size={16} /> Log something</button></div><div className="attention-section"><p className="eyebrow2">Where your attention went</p><h2 className="section-title">Focused, not fragmented.</h2><Attention minutes={data?.deepWorkMinutes ?? 0} parts={attentionParts} /></div></section>
      <section className="chart-section"><div className="chart-heading"><div><p className="eyebrow2">Trajectory vs time</p><h2 className="section-title">Actual life progress</h2></div><p>Actual progress in orange. Expected month pace in the dotted line.</p></div><ProgressChart score={data?.score ?? 0} /></section>
      <section className="bento"><p className="eyebrow2">Your life</p><h2 className="section-title">Different areas. One direction.</h2><div className="bento-grid">{areas.map((area, index) => <Link href={`/areas/${area.area.toLowerCase()}`} key={area.area} className={`bento-cell ${index === 0 ? "large" : index === 2 ? "wide" : ""}`}><b style={{ color: areaColors[area.area] }}>{area.area.toUpperCase()}</b><h3>{area.score || "—"}{area.score ? "%" : ""}</h3><p>{area.area === "Faith" ? "Reading consistency and current streak" : area.area === "Fitness" ? "Training momentum and bench progression" : area.area === "Odysseus" ? "Revenue, learners and pitch readiness" : area.area === "Ledgerly" ? "MVP phases and next product milestone" : area.area === "Coding" ? "DSA practice and technical depth" : "Choose a goal to bring this area into focus"}</p></Link>)}</div></section>
      <section className="horizon"><p className="eyebrow2">On the horizon</p><h2 className="section-title">What you are approaching.</h2><div className="horizon-items">{goals.slice(0, 4).map((goal) => <Link href={`/areas/${goal.area.toLowerCase()}`} key={goal.id}><b>{goal.area}</b><span>{goal.title} · {Math.max(0, Math.round(goal.target - goal.current_value))} remaining</span></Link>)}</div></section>
      <section className="journal-quote">“{latest?.content ?? "A journal becomes useful when it makes the next honest action easier to see."}”<footer>{latest ? `${latest.entry_date} · ${latest.entry_type} · ` : ""}<Link href="/journal">Read reflection →</Link></footer></section>
    </div>
    {open && <div className="modal-backdrop"><form className="modal" onSubmit={log}><p className="eyebrow2">Quick log · L / Ctrl K</p><h2>What moved today?</h2><div className="log-kinds">{logKinds.map((value) => <button type="button" className={kind === value ? "selected" : ""} onClick={() => setKind(value)} key={value}>{value}</button>)}</div><label>{kind}<input value={detail} onChange={(event) => setDetail(event.target.value)} autoFocus placeholder={`${kind} details`} /></label><button className="save">Log it</button><button type="button" onClick={() => setOpen(false)}>Cancel</button></form></div>}
  </main>;
}

function Event({ time, title, detail, color }: { time: string; title: string; detail: string; color: string }) { return <div className="event"><time>{time}</time><div style={{ borderLeft: `3px solid ${color}`, paddingLeft: 12 }}><b>{title}</b><small>{detail}</small></div></div>; }
