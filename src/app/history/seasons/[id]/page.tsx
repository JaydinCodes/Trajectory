"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Detail = { item: { season: { id: number; name: string; theme: string; intention: string | null }; status: string; trajectory: { start: number; end: number; change: number }; metrics: Array<{ key: string; label: string; total: number }>; milestones: Array<{ id: number; title: string; area: string; achievedAt: string }>; directions: Array<{ id: number; area: string; statement: string }>; review?: { lesson: string; carryForward: string; leaveBehind: string } }; review?: { goals: { all: Array<{ id: number; area: string; title: string; endValue: number; target: number; endPercentage: number }> }; weeklyReviews: Array<{ weekStart: string; primaryFocus: string; lesson: string }>; journalHighlights: Array<{ id: number; content: string; entryDate: string }> } };
const display = (key: string, total: number) => key === "deep_work_minutes" ? `${Math.floor(total / 60)}h ${total % 60}m` : total.toLocaleString("en-ZA");

export default function HistoricalSeasonPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Detail>();
  useEffect(() => { void fetch(`/api/history/seasons/${id}`).then((response) => response.json()).then(setData); }, [id]);
  const item = data?.item;
  if (!item) return <main className="history-detail"><Link href="/history" className="back">← History</Link><p>Loading season…</p></main>;
  return <main className="history-detail">
    <Link href="/history" className="back">← History</Link>
    <header className="history-hero"><p className="eyebrow">{item.status === "active" ? "In progress" : "Historical season"}</p><h1>{item.season.name}</h1><h2>{item.season.theme || "A season in motion."}</h2>{item.season.intention && <p>{item.season.intention}</p>}</header>
    <section className="detail-trajectory"><span>Trajectory movement</span><b>{item.trajectory.start}% → {item.trajectory.end}%</b><em>{item.trajectory.change >= 0 ? "+" : ""}{item.trajectory.change} points</em></section>
    {item.directions.length > 0 && <section className="detail-section"><p className="eyebrow">This season served</p><h2>Direction at the time.</h2>{item.directions.map((direction) => <p className="detail-goal" key={direction.id}><span>{direction.area} direction</span><b>{direction.statement}</b></p>)}</section>}
    <section className="detail-section"><p className="eyebrow">Goals</p><h2>What this chapter moved toward.</h2>{data.review?.goals.all.map((goal) => <Link className="detail-goal" href={`/history/goals/${goal.id}`} key={goal.id}><span>{goal.area}</span><b>{goal.title}</b><em>{goal.endValue} / {goal.target} · {Math.round(goal.endPercentage)}%</em></Link>)}</section>
    <section className="detail-section"><p className="eyebrow">Evidence</p><h2>The record, in numbers.</h2><div className="detail-metrics">{item.metrics.filter((metric) => metric.total > 0).map((metric) => <article key={metric.key}><b>{display(metric.key, metric.total)}</b><span>{metric.label}</span></article>)}</div></section>
    <section className="detail-section"><p className="eyebrow">Milestones</p><h2>What you explicitly marked.</h2>{item.milestones.length ? <div className="detail-list">{item.milestones.map((milestone) => <p key={milestone.id}><b>{milestone.achievedAt}</b>{milestone.title}<span>{milestone.area}</span></p>)}</div> : <p className="history-empty">No milestones were recorded in this season.</p>}</section>
    <section className="detail-section"><p className="eyebrow">Your weeks</p><h2>Focuses and lessons.</h2><div className="detail-list">{data.review?.weeklyReviews.map((week) => <p key={week.weekStart}><b>{week.weekStart}</b>{week.primaryFocus || week.lesson}<span>{week.lesson}</span></p>)}</div></section>
    <section className="detail-section"><p className="eyebrow">From your journal</p>{data.review?.journalHighlights.map((entry) => <blockquote key={entry.id}>“{entry.content}”<footer>{entry.entryDate}</footer></blockquote>)}</section>
    {item.review && <section className="detail-reflection"><p className="eyebrow">Season transition</p><h2>What came next.</h2>{item.review.carryForward && <p><b>Carry forward</b>{item.review.carryForward}</p>}{item.review.leaveBehind && <p><b>Leave behind</b>{item.review.leaveBehind}</p>}{item.review.lesson && <p><b>Lesson</b>{item.review.lesson}</p>}</section>}
    <Link className="history-review-link" href={`/review/season?seasonId=${item.season.id}`}>Open full Season Review →</Link>
  </main>;
}
